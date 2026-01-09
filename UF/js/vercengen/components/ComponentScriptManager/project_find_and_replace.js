ve.ScriptManager.FindAndReplace = class {
	constructor (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Initialise options
		this.options = options;
		
		//Declare local instance variables
		this.ignore_folders = (options.ignore_folders) ? options.ignore_folders : [
			"build",
			"dist",
			".DS_Store",
			".git",
			"node_modules"
		];
		this.matches = [];
		this.selected_index = -1;
		
		//State for async operations
		this.is_searching = false;
		this.cancel_search = false;
	}
	
	/**
	 * Draws the container or appends results.
	 * @param {HTMLElement} arg0_element - The container element.
	 * @param {Array} arg1_new_results - Array of new matches to append.
	 * @param {Boolean} arg2_reset - If true, clears the list and redraws the container structure.
	 */
	draw (arg0_element, arg1_new_results, arg2_reset) {
		//Convert from parameters
		let element = (arg0_element) ? arg0_element : document.createElement("div");
		let new_results = (arg1_new_results) ? arg1_new_results : [];
		let should_reset = (arg2_reset === true);
		
		//1. Initialize container if resetting
		if (should_reset) {
			let is_open = false;
			let old_details_el = element.querySelector(`#matches-details`);
			if (old_details_el && typeof old_details_el.getAttribute("open") === "string")
				is_open = true;
			
			element.innerHTML = `<details id = "matches-details"${(!is_open) ? is_open : " open"}>
				<summary id = "matches-label">Occurrences (0)</summary>
			</details>`;
		}
		
		let matches_container_el = element.querySelector(`#matches-details`);
		let matches_label_el = element.querySelector(`#matches-label`);
		
		//Update total count label
		if (matches_label_el) {
			matches_label_el.innerHTML = `Occurrences (${String.formatNumber(this.matches.length)})`;
		}
		
		//2. Append new results only (Streaming UI)
		//Calculate the starting index for these new results within the main array
		let start_index = this.matches.length - new_results.length;
		
		for (let i = 0; i < new_results.length; i++) {
			let global_index = start_index + i;
			let local_entry_el = document.createElement("div");
			
			local_entry_el.className = (this.selected_index === global_index) ? "match-entry selected" : "match-entry";
			local_entry_el.innerHTML = `${new_results[i].file}:${new_results[i].line}`;
			local_entry_el.title = new_results[i].match; //Tooltip for full line
			
			//Add click event for manual selection
			local_entry_el.onclick = () => {
				//Clear previous selection visually
				let prev_selected = matches_container_el.querySelector(".match-entry.selected");
				if (prev_selected) prev_selected.classList.remove("selected");
				
				this.selected_index = global_index;
				local_entry_el.classList.add("selected");
				
				//Save content if possible
				if (this.script_manager_instance) {
					let monaco_obj = this.script_manager_instance.scene_monaco.editor;
					
					if (!this._saved_file_content)
						this._saved_file_content = this.script_manager_instance.v;
					
					//Scroll to position and move caret to it
					this.script_manager_instance.v = fs.readFileSync(new_results[i].file, "utf8");
					setTimeout(() => {
						monaco_obj.revealLine(new_results[i].line);
						monaco_obj.setSelection({
							startLineNumber: new_results[i].line,
							startColumn: new_results[i].start_column,
							endLineNumber: new_results[i].line,
							endColumn: new_results[i].end_column
						});
						monaco_obj.focus();
					}, 100);
				}
			};
			
			matches_container_el.appendChild(local_entry_el);
		}
	}
	
	/**
	 * Async execution of Find (and optionally Replace All).
	 * Streaming results are returned via callbacks.
	 */
	async execute (arg0_root_path, arg1_search_string, arg2_replace_string, arg3_options, arg4_callbacks) {
		//Convert from parameters
		let root_path = arg0_root_path;
		let search_string = arg1_search_string;
		let replace_string = arg2_replace_string;
		let options = (arg3_options) ? arg3_options : {};
		let callbacks = (arg4_callbacks) ? arg4_callbacks : {
			onmatch: () => {},
			onprogress: () => {},
			onfinish: () => {}
		};
		
		//Handle Cancellation
		if (this.is_searching) {
			this.cancel_search = true;
			//Wait a tick for the previous loop to exit
			await new Promise(r => setTimeout(r, 100));
		}
		this.is_searching = true;
		this.cancel_search = false;
		
		//Initialise options
		options.flags = (options.flags) ? options.flags : ["g"];
		if (options.is_case_sensitive === undefined) options.is_case_sensitive = true;
		if (options.is_regex === undefined) options.is_regex = false;
		
		//Regex 'i' flag is for case-insensitivity; only add if is_case_sensitive is false
		if (!options.is_case_sensitive) options.flags.push("i");
		
		//Declare local instance variables
		let pattern;
		try {
			pattern = (options.is_regex) ?
				new RegExp(search_string, options.flags.join("")) :
				new RegExp(search_string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), options.flags.join(""));
		} catch (e) {
			console.error("Invalid Regex:", e);
			this.is_searching = false;
			if (callbacks.onfinish) callbacks.onfinish();
			return;
		}
		
		let stats = { scanned: 0 };
		
		//Start Async Traversal
		await this._traverse(root_path, pattern, replace_string, stats, callbacks);
		
		this.is_searching = false;
		if (callbacks.onfinish) callbacks.onfinish();
	}
	
	async _traverse (arg0_current_path, arg1_pattern, arg2_replace_string, arg3_stats, arg4_callbacks) {
		//Check cancellation
		if (this.cancel_search) return;
		
		let current_path = arg0_current_path;
		let pattern = arg1_pattern;
		let replace_string = arg2_replace_string;
		let stats = arg3_stats;
		let callbacks = arg4_callbacks;
		
		try {
			//Use fs.promises for async file ops
			let file_stat = await fs.promises.stat(current_path);
			
			if (file_stat.isDirectory()) {
				let all_files = await fs.promises.readdir(current_path);
				
				for (let local_file of all_files) {
					if (this.cancel_search) return;
					if (this.ignore_folders.includes(local_file)) continue;
					
					//Recursion
					await this._traverse(path.join(current_path, local_file), pattern, replace_string, stats, callbacks);
				}
			} else if (file_stat.isFile()) {
				stats.scanned++;
				
				//Throttle progress updates to UI (every 10 files) to save performance
				if (stats.scanned % 10 === 0 && callbacks.onprogress)
					callbacks.onprogress(stats.scanned);
				
				await this._processFile(current_path, pattern, replace_string, callbacks);
			}
		} catch (e) {
			//Permission errors or locked files are common, just log and continue
			//console.warn(`Skipping ${current_path}: ${e.message}`);
		}
	}
	
	async _processFile (arg0_file_path, arg1_pattern, arg2_replace_string, arg3_callbacks) {
		let file_path = arg0_file_path;
		let pattern = arg1_pattern;
		let replace_string = arg2_replace_string;
		let callbacks = arg3_callbacks;
		
		try {
			//Async read
			let buffer = await fs.promises.readFile(file_path);
			if (buffer.indexOf(0) !== -1) return; //Binary guard
			
			let content = buffer.toString("utf8");
			let lines = content.split(/\r?\n/);
			let match_found_in_file = false;
			let file_matches = [];
			
			//Iterate lines
			lines.forEach((line_content, index) => {
				//Reset lastIndex to ensures we find the first match on the line
				pattern.lastIndex = 0;
				let local_match = pattern.exec(line_content);
				
				if (local_match) {
					match_found_in_file = true;
					
					file_matches.push({
						file: file_path,
						line: index + 1,
						match: line_content.trim(),
						start_column: local_match.index + 1,
						end_column: local_match.index + 1 + local_match[0].length,
					});
				}
			});
			
			//If matches found, notify callback immediately (Streaming)
			if (match_found_in_file) {
				if (replace_string !== undefined) {
					let new_content = content.replace(pattern, replace_string);
					await fs.promises.writeFile(file_path, new_content, "utf8");
				} else {
					if (callbacks.onmatch)
						callbacks.onmatch(file_matches);
				}
			}
		} catch (e) {
			console.error(`Error processing ${file_path}: ${e.message}`);
		}
	}
	
	getFiles (arg0_matches) {
		//Convert from parameters
		let matches = (arg0_matches) ? arg0_matches : [];
		
		//Declare local instance variables
		let all_files = [];
		
		//Iterate over all matches
		for (let i = 0; i < matches.length; i++)
			if (!all_files.includes(matches[i].file))
				all_files.push(matches[i].file);
		
		//Return statement
		return all_files;
	}
	
	// Kept synchronous as this is usually a user-triggered single action
	_replaceInFile (arg0_file_path, arg1_pattern, arg2_line_number, arg3_replace_string) {
		//Convert from parameters
		let file_path = arg0_file_path;
		let pattern = arg1_pattern;
		let line_number = arg2_line_number;
		let replace_string = arg3_replace_string;
		
		try {
			let content = fs.readFileSync(file_path, "utf8");
			let lines = content.split(/\r?\n/);
			
			let target_line = lines[line_number - 1];
			pattern.lastIndex = 0;
			
			if (pattern.test(target_line)) {
				//Reset lastIndex again because .test() advanced it
				pattern.lastIndex = 0;
				
				lines[line_number - 1] = target_line.replace(pattern, replace_string);
				fs.writeFileSync(file_path, lines.join("\n"), "utf8");
				
				return true;
			}
		} catch (e) { console.error(e); }
		
		return false;
	}
};

/**
 * Opens a global find and replace prompt across the current set project folder.
 * - Method of: {@link ve.ScriptManager}
 *
 * @private
 */
ve.ScriptManager.prototype._openFindAndReplace = function () {
	//Declare local instance variables
	let current_folder = (this._settings.project_folder !== "none") ?
		this._settings.project_folder : this.leftbar_file_explorer.v;
	
	if (!this._find_and_replace_obj) {
		this._find_and_replace_obj = new ve.ScriptManager.FindAndReplace();
			this._find_and_replace_obj.script_manager_instance = this;
	}
	
	let matches_el = document.createElement("div");
	matches_el.id = "ve-script-manager-find-and-replace";
	
	//Internal helper to get current RegExp pattern based on UI settings
	let local_get_pattern = () => {
		let local_flags = ["g"];
		if (!this._settings.far_is_case_sensitive) local_flags.push("i");
		
		return (this._settings.far_is_regex) ?
			new RegExp(this._settings.far_find_text, local_flags.join("")) :
			new RegExp(this._settings.far_find_text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), local_flags.join(""));
	};
	let local_get_folder = () => {
		current_folder = (this._settings.project_folder !== "none") ?
			this._settings.project_folder : this.leftbar_file_explorer.v;
	};
	
	//Open this.find_and_replace_window
	if (this.find_and_replace_window) this.find_and_replace_window.close();
	
	//Create Status Element
	let status_el = document.createElement("div");
		status_el.id = "status-label";
		status_el.innerHTML = "Ready.";
	
	this.find_and_replace_window = new ve.Window({
		find_text: new ve.Text((this._settings.far_find_text) ? this._settings.far_find_text : "", {
			name: "Find:",
			onuserchange: (v) => {
				this._settings.far_find_text = v;
			}
		}),
		replace_text: new ve.Text((this._settings.far_replace_text) ? this._settings.far_replace_text : "", {
			name: "Replace:",
			onuserchange: (v) => {
				this._settings.far_replace_text = v;
			}
		}),
		toggles: new ve.RawInterface({
			is_case_sensitive: new ve.Toggle(this._settings.far_is_case_sensitive, {
				name: "Is Case Sensitive",
				onuserchange: (v) => {
					this._settings.far_is_case_sensitive = v;
				}
			}),
			is_regex: new ve.Toggle(this._settings.far_is_regex, {
				name: "Is Regex",
				onuserchange: (v) => {
					this._settings.far_is_regex = v;
				}
			}),
		}, {
			style: { display: "flex" }
		}),
		status: new ve.HTML(status_el),
		matches: new ve.HTML(matches_el),
		
		actions_bar: new ve.RawInterface({
			find: new ve.Button(() => {
				if (this._settings.far_find_text) {
					let local_far = this._find_and_replace_obj;
					local_get_folder();
					
					//1. Clear previous results
					local_far.matches = [];
					local_far.selected_index = -1;
					local_far.draw(matches_el, [], true); //true = reset container
					status_el.innerHTML = "Scanning ..";
					
					//2. Execute Async
					local_far.execute(current_folder, this._settings.far_find_text, undefined, {
						is_case_sensitive: this._settings.far_is_case_sensitive,
						is_regex: this._settings.far_is_regex
					}, {
						onmatch: (new_matches) => {
							//Add to main array
							local_far.matches.push(...new_matches);
							//Update UI incrementally
							local_far.draw(matches_el, new_matches, false);
						},
						onprogress: (count) => {
							status_el.innerHTML = `Scanning .. (${String.formatNumber(count)} files)`;
						},
						onfinish: () => {
							status_el.innerHTML = `Search complete. Found ${String.formatNumber(local_far.matches.length)} matches in ${String.formatNumber(local_far.getFiles(local_far.matches).length)} file(s).`;
							
							//Auto-select first match if exists
							if (local_far.matches.length > 0 && local_far.selected_index === -1) {
								local_far.selected_index = 0;
								//Force redraw just to highlight the selection
								local_far.draw(matches_el, [], false);
							}
						}
					});
				}
			}, {
				name: "Find"
			}),
			replace: new ve.Button(() => {
				let local_far = this._find_and_replace_obj;
				local_get_folder();
				
				if (local_far.selected_index !== -1 && local_far.matches[local_far.selected_index]) {
					let local_match = local_far.matches[local_far.selected_index];
					let local_pattern = local_get_pattern();
					
					//Perform single line replacement
					local_far._replaceInFile(local_match.file, local_pattern, local_match.line, this._settings.far_replace_text);
					
					//Remove replaced entry
					local_far.matches.splice(local_far.selected_index, 1);
					
					//Adjust selection
					if (local_far.selected_index >= local_far.matches.length)
						local_far.selected_index = (local_far.matches.length > 0) ? 0 : -1;
					
					//Redraw list (Since we removed an item, we usually need to redraw the structure to fix indices/visuals)
					//For optimization, we could just remove the DOM element, but redraw is safer here.
					local_far.draw(matches_el, [], true);
					local_far.draw(matches_el, local_far.matches, false);
				}
			}, {
				name: "Replace"
			}),
			replace_all: new ve.Button(() => {
				if (this._settings.far_find_text) {
					//Confirmation dialog could go here
					veConfirm(`Are you sure you want to replace all occurrences of ${this._settings.far_find_text} in ${current_folder}?`, {
						special_function: () => {
							let local_far = this._find_and_replace_obj;
							local_get_folder();
							status_el.innerHTML = "Replacing...";
							
							local_far.execute(current_folder, this._settings.far_find_text, this._settings.far_replace_text, {
								is_case_sensitive: this._settings.far_is_case_sensitive,
								is_regex: this._settings.far_is_regex
							}, {
								onprogress: (count) => {
									status_el.innerHTML = `Processing .. (${String.formatNumber(count)} files)`;
								},
								onfinish: () => {
									status_el.innerHTML = "Replace All Complete.";
									local_far.matches = [];
									local_far.selected_index = -1;
									local_far.draw(matches_el, [], true);
								}
							});
						}
					});
				}
			}, {
				name: "Replace All"
			})
		}, {
			style: { display: "flex" }
		}),
	}, {
		name: "Find and Replace",
		width: "30rem",
		can_rename: false
	});
};