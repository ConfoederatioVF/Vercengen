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
	}
	
	draw (arg0_element, arg1_results) {
		//Convert from parameters
		let element = (arg0_element) ? arg0_element : document.createElement("div");
		let results = (arg1_results) ? arg1_results : [];
		
		//Iterate over all results and append them to the given element
		for (let i = 0; i < results.length; i++) {
			let local_entry_el = document.createElement("div");
				local_entry_el.className = "match-entry";
				local_entry_el.innerHTML = `${results[i].file}:${results[i].line}`;
			
			element.appendChild(local_entry_el);
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
		
		if (options.is_case_sensitive) options.flags.push("i");
		
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
				pattern.last_index = 0; //Reset regex state for global patterns
				
				if (pattern.test(line_content)) {
					match_found_in_file = true;
					results.push({
						file: file_path,
						line: index + 1,
						match: line_content.trim()
					});
				}
			});
			
			//If a replacement string is provided and matches were found, update the file
			if (replace_string !== undefined && match_found_in_file) {
				let new_content = content.replace(pattern, replace_string);
				fs.writeFileSync(file_path, new_content, "utf8");
			}
		} catch (e) {
			console.error(`Could not process file ${file_path}: ${e.message}`);
		}
	}
};

/**
 * Opens a global find and replace prompt across the current set project folder. If no project folder is set, it looks in the current leftbar file explorer.
 * - Method of: {@link ve.ScriptManager}
 * 
 * @private
 */
ve.ScriptManager.prototype._openFindAndReplace = function () {
	//Declare local instance variables
	let current_folder = (this._settings.project_folder !== "none") ? 
		this._settings.project_folder : this.leftbar_file_explorer.v;
	if (this._find_and_replace_obj) this._find_and_replace_obj = new ve.ScriptManager.FindAndReplace();
	let matches_el = document.createElement("div");
		matches_el.id = "matches";
	
	//Open this.find_and_replace_window
	if (this.find_and_replace_window) this.find_and_replace_window.close();
	this.find_and_replace_window = new ve.Window({
		find_text: new ve.Text((this._settings.far_find_text) ? this._settings.far_find_text : "", { //[WIP] - Add Find Text functionality
			name: "Find:",
			width: 99,
			x: 0,
			y: 0,
			
			onuserchange: (v) => {
				this._settings.far_find_text = v;
			}
		}),
		replace_text: new ve.Text((this._settings.far_replace_text) ? this._settings.far_replace_text : "", {
			name: "Replace:",
			width: 99,
			x: 0,
			y: 1,
			
			onuserchange: (v) => {
				this._settings.far_replace_text = v;
			}
		}),
		is_case_sensitive: new ve.Toggle(this._settings.far_is_case_sensitive, {
			name: "Is Case Sensitive",
			onuserchange: (v) => {
				this._settings.far_is_case_sensitive = v;
			},
			x: 0,
			y: 2
		}),
		is_regex: new ve.Toggle(this._settings.far_is_regex, {
			name: "Is Regex",
			onuserchange: (v) => {
				this._settings.far_is_regex = v;
			},
			x: 1,
			y: 2
		}),
		
		matches: new ve.HTML(matches_el, {
			width: 99,
			y: 3
		}),
		replace: new ve.Button(() => { //[WIP] - Add Replace functionality
			
		}, {
			name: "Replace",
			x: 0,
			y: 4
		}),
		replace_all: new ve.Button(() => { //[WIP] - Add Replace All functionality
			
		}, {
			name: "Replace All",
			x: 1,
			y: 4
		})
	}, {
		name: "Find and Replace",
		width: "30rem",
		
		can_rename: false
	});
};