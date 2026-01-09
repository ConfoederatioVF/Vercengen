ve.ScriptManager.FindAndReplace = class {
	constructor (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
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
	}
	
	draw (arg0_element, arg1_results) {
		//Convert from parameters
		let element = (arg0_element) ? arg0_element : document.createElement("div");
		let results = (arg1_results) ? arg1_results : [];
		
		//Declare local instance variables
		let is_open = false;
		let old_details_el = element.querySelector(`#matches-details`);
			if (old_details_el && typeof old_details_el.getAttribute("open") === "string")
				is_open = true;
		
		//Populate element
		element.innerHTML = `<details id = "matches-details"${(!is_open) ? is_open : " open"}>
			<summary id = "matches-label"></summary>
		</details>`;
		
		let matches_container_el = element.querySelector(`#matches-details`);
		let matches_label_el = element.querySelector(`#matches-label`);
			matches_label_el.innerHTML = `Occurrences (${String.formatNumber(results.length)})`;
		
		//Iterate over all results and append them to the given element
		for (let i = 0; i < results.length; i++) {
			let local_entry_el = document.createElement("div");
			local_entry_el.className = (this.selected_index === i) ? "match-entry selected" : "match-entry";
			local_entry_el.innerHTML = `${results[i].file}:${results[i].line}`;
			
			//Add click event for manual selection
			local_entry_el.onclick = () => {
				this.selected_index = i;
				this.draw(element, results);
			};
			
			matches_container_el.appendChild(local_entry_el);
		}
	}
	
	execute (arg0_root_path, arg1_search_string, arg2_replace_string, arg3_options) {
		//Convert from parameters
		let root_path = arg0_root_path;
		let search_string = arg1_search_string;
		let replace_string = arg2_replace_string;
		let options = (arg3_options) ? arg3_options : {};
		
		//Initialise options
		options.flags = (options.flags) ? options.flags : ["g"];
		if (options.is_case_sensitive === undefined) options.is_case_sensitive = true;
		if (options.is_regex === undefined) options.is_regex = true;
		
		//Regex 'i' flag is for case-insensitivity; only add if is_case_sensitive is false
		if (!options.is_case_sensitive) options.flags.push("i");
		
		//Declare local instance variables
		let pattern = (options.is_regex) ?
			new RegExp(search_string, options.flags.join("")) :
			new RegExp(search_string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), options.flags.join(""));
		let results = [];
		
		//Traverse current path
		this._traverse(root_path, pattern, replace_string, results);
		
		//Return statement
		return results;
	}
	
	_traverse (arg0_current_path, arg1_pattern, arg2_replace_string, arg3_results) {
		//Convert from parameters
		let current_path = arg0_current_path;
		let pattern = arg1_pattern;
		let replace_string = arg2_replace_string;
		let results = arg3_results;
		
		//Declare local instance variables
		let stats = fs.statSync(current_path);
		
		if (stats.isDirectory()) {
			let all_files = fs.readdirSync(current_path);
			
			for (let local_file of all_files) {
				if (this.ignore_folders.includes(local_file)) continue;
				this._traverse(path.join(current_path, local_file), pattern, replace_string, results);
			}
		} else if (stats.isFile()) {
			this._processFile(current_path, pattern, replace_string, results);
		}
	}
	
	_processFile (arg0_file_path, arg1_pattern, arg2_replace_string, arg3_results) {
		//Convert from parameters
		let file_path = arg0_file_path;
		let pattern = arg1_pattern;
		let replace_string = arg2_replace_string;
		let results = arg3_results;
		
		//Try to process the given file
		try {
			//Declare local instance variables
			let buffer = fs.readFileSync(file_path);
			if (buffer.indexOf(0) !== -1) return; //Internal guard clause for binary files
			
			let content = buffer.toString("utf8");
			let lines = content.split(/\r?\n/);
			let match_found_in_file = false;
			
			//Iterate over all lines
			lines.forEach((line_content, index) => {
				pattern.lastIndex = 0; //Javascript native property is camelCase
				
				if (pattern.test(line_content)) {
					match_found_in_file = true;
					results.push({
						file: file_path,
						line: index + 1,
						match: line_content.trim()
					});
				}
			});
			
			//If a replacement string is provided (Replace All) and matches were found, update the file
			if (replace_string !== undefined && match_found_in_file) {
				let new_content = content.replace(pattern, replace_string);
				fs.writeFileSync(file_path, new_content, "utf8");
			}
		} catch (e) {
			console.error(`Could not process file ${file_path}: ${e.message}`);
		}
	}
	
	_replaceInFile (arg0_file_path, arg1_pattern, arg2_line_number, arg3_replace_string) {
		//Convert from parameters
		let file_path = arg0_file_path;
		let pattern = arg1_pattern;
		let line_number = arg2_line_number;
		let replace_string = arg3_replace_string;
		
		try {
			//Declare local instance variables
			let content = fs.readFileSync(file_path, "utf8");
			let lines = content.split(/\r?\n/);
			
			//Lines are 1-indexed for users, 0-indexed for arrays
			let target_line = lines[line_number - 1];
			pattern.lastIndex = 0;
			
			if (pattern.test(target_line)) {
				//FIX: Reset lastIndex again because .test() advanced it
				pattern.lastIndex = 0;
				
				lines[line_number - 1] = target_line.replace(pattern, replace_string);
				fs.writeFileSync(file_path, lines.join("\n"), "utf8");
				
				return true;
			}
		} catch (e) { console.error(e); }
		
		//Return statement
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
	if (!this._find_and_replace_obj) this._find_and_replace_obj = new ve.ScriptManager.FindAndReplace();
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
	
	//Open this.find_and_replace_window
	if (this.find_and_replace_window) this.find_and_replace_window.close();
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
		matches: new ve.HTML(matches_el, {
		}),
		
		actions_bar: new ve.RawInterface({
			find: new ve.Button(() => {
				if (this._settings.far_find_text) {
					let local_far = this._find_and_replace_obj;
					
					local_far.matches = local_far.execute(current_folder, this._settings.far_find_text, undefined, {
						is_case_sensitive: this._settings.far_is_case_sensitive,
						is_regex: this._settings.far_is_regex
					});
					local_far.selected_index = (local_far.matches.length > 0) ? 0 : -1;
					local_far.draw(matches_el, local_far.matches);
				}
			}, {
				name: "Find"
			}),
			replace: new ve.Button(() => {
				let local_far = this._find_and_replace_obj;
				
				if (local_far.selected_index !== -1 && local_far.matches[local_far.selected_index]) {
					let local_match = local_far.matches[local_far.selected_index];
					let local_pattern = local_get_pattern();
					
					//Perform single line replacement
					local_far._replaceInFile(local_match.file, local_pattern, local_match.line, this._settings.far_replace_text);
					
					//Remove replaced entry and advance selection
					local_far.matches.splice(local_far.selected_index, 1);
					if (local_far.selected_index >= local_far.matches.length) {
						local_far.selected_index = (local_far.matches.length > 0) ? 0 : -1;
					}
					
					local_far.draw(matches_el, local_far.matches);
				}
			}, {
				name: "Replace"
			}),
			replace_all: new ve.Button(() => {
				if (this._settings.far_find_text) {
					let local_far = this._find_and_replace_obj;
					
					local_far.execute(current_folder, this._settings.far_find_text, this._settings.far_replace_text, {
						is_case_sensitive: this._settings.far_is_case_sensitive,
						is_regex: this._settings.far_is_regex
					});
					
					//Reset state and clear UI
					local_far.matches = [];
					local_far.selected_index = -1;
					local_far.draw(matches_el, []);
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