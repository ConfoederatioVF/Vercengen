//Import Node.js libraries
global.fs = require("fs");
global.path = require("path");

//Initialise functions
{
	if (!global.ve) global.ve = {};
	ve.debug_mode = true;
	
	/**
	 * Returns all non-evaluated files in a folder, so long as an evaluated set is provided.
	 *
	 * @param {string} arg0_folder_path
	 * @param {Set<string>} arg1_evaluated_set
	 *
	 * @returns {Array<string>}
	 */
	ve.getFilesInFolder = function (arg0_folder_path, arg1_evaluated_set) {
		//Convert from parameters
		var folder_path = arg0_folder_path;
		var evaluated_set = arg1_evaluated_set;
		
		//Declare local instance variables
		var file_list = fs.readdirSync(folder_path, { withFileTypes: true });
		var return_files = [];
		
		//Iterate over all entries in file_list
		for (var local_file_entry of file_list) {
			var full_path = path.join(folder_path, local_file_entry.name);
			
			if (evaluated_set.has(full_path)) continue;
				evaluated_set.add(full_path);
				
			//Recursively import files from directories
			if (local_file_entry.isDirectory()) {
				return_files = return_files.concat(ve.getFilesInFolder(full_path, evaluated_set));
			} else {
				return_files.push(full_path);
			}
		}
		
		//Return statement
		return return_files;
	};
	
	/**
	 * Returns an Array<String> from a list of patterns. The last pattern
	 * to match a file determines its final position in the load order. This
	 * function iterates patterns in reverse to ensure that more specific
	 * patterns listed later correctly claim files from broader patterns
	 * listed earlier.
	 *
	 * @param {Array<string>} patterns The list of patterns to resolve.
	 * @returns {Array<string>} The final, ordered list of file paths.
	 */
	ve.getImportFiles = function (patterns) { //[WIP] - Refactor from AI
		const base = process.cwd();
		const finalFiles = [];
		const handledPaths = new Set(); // Tracks files that have already been placed.
		const excludedPaths = new Set(); // Tracks files explicitly excluded by `!`.
		
		// Process patterns in reverse order (from last to first).
		// This is the key to ensuring the "last match wins" rule.
		for (let i = patterns.length - 1; i >= 0; i--) {
			let pattern = patterns[i];
			const isExclusion = pattern.startsWith("!");
			if (isExclusion) {
				pattern = pattern.slice(1);
			}
			
			let files = [];
			if (pattern.includes("*")) {
				files = ve.getWildcardsInFolder(base, pattern);
			} else {
				const absolutePath = path.resolve(base, pattern);
				if (fs.existsSync(absolutePath)) {
					// Use your original, RECURSIVE function for directories.
					if (fs.statSync(absolutePath).isDirectory()) {
						files = ve.getFilesInFolder(absolutePath, new Set());
					} else {
						files = [absolutePath]; // It's a single file.
					}
				}
				// Silently ignore patterns that don't exist.
			}
			
			// Since we're iterating backwards, we prepend files to maintain order.
			// We also process the files found by a pattern in reverse to counteract
			// the unshift, keeping the original readdir order.
			for (let j = files.length - 1; j >= 0; j--) {
				const file = files[j];
				if (isExclusion) {
					excludedPaths.add(file);
				} else {
					// A file is only added if it hasn't been claimed by a later,
					// higher-priority pattern already.
					if (!handledPaths.has(file)) {
						finalFiles.unshift(file);
						handledPaths.add(file);
					}
				}
			}
		}
		
		// Final pass: filter out any files that were explicitly excluded.
		return finalFiles.filter(file => !excludedPaths.has(file));
	};
	
	/**
	 * Returns the absolute file paths of all wildcards within a given folder.
	 *
	 * @param {string} arg0_folder_path
	 * @param {Array<string>} arg1_wildcard_pattern
	 *
	 * @returns {Array<string>}
	 */
	ve.getWildcardsInFolder = function (arg0_folder_path, arg1_wildcard_pattern) {
		//Convert from parameters
		var folder_path = arg0_folder_path;
		var wildcard_pattern = arg1_wildcard_pattern;
		
		//Declare local instance variables
		var base = path.basename(wildcard_pattern);
		var directory = path.dirname(wildcard_pattern);
		
		//Non-wildcard resolution
		if (!base.includes("*")) {
			//No wildcard, simply return if the file exists
			var absolute_path = path.resolve(folder_path, wildcard_pattern);
			
			//Return statement
			if (fs.existsSync(absolute_path) && fs.statSync(absolute_path).isFile())
				return [absolute_path];
			if (fs.existsSync(absolute_path) && fs.statSync(absolute_path).isDirectory())
				return ve.getFilesInFolder(absolute_path, new Set());
			return [];
		}
		
		//Wildcard: match files in the directory
		var absolute_dir = path.resolve(folder_path, directory);
		
		//Return statement
		if (!fs.existsSync(absolute_dir) || !fs.statSync(absolute_dir).isDirectory())
			return [];
		
		//Return regex wildcard; return statement
		var regex = new RegExp("^" +
			base.replace(/\./g, "\\.")
				.replace(/\*/g, ".*") + "$"
		);
		
		return fs.readdirSync(absolute_dir)
			.filter((f) => regex.test(f))
			.map((f) => path.join(absolute_dir, f))
			.filter((f) => fs.statSync(f).isFile());
	};
	
	/**
	 * Initialises Vercengen and associated UF files.
	 */
	ve.initialise = function () {
		//Initialise UF handlers
		new DALS.Timeline(); //Initialise starting timeline
		HTML.initialise();
		
		ve.window_overlay_el = document.createElement("div");
		ve.window_overlay_el.id = "ve-overlay";
		ve.window_overlay_el.setAttribute("class", "ve overlay");
		document.body.appendChild(ve.window_overlay_el);
		setTimeout(() => {
			ve.Component.linter(); //Lint ve.Component library
		}, 100);
	};
	
	/**
	 * Initialises a Vercengen app, alongside necessary UF imports.
	 *
	 * arg0_options: {@link Object}
	 * - `.do_not_import_UF`: {@link boolean} - Whether to refuse UF imports unrelated to Vercengen startup functions.
	 * - `.load_files`: {@link Array}<{@link string}> - The sequence of files to load. `!` should be used as an exclusion prefix, whilst `*` functions as a wildcard pattern.
	 * - `.is_browser=true`: {@link boolean} - Whether the imports are for the Browser/Electron. Imports are assumed to be eval/Node.js otherwise.
	 * - `.is_node=false`: {@link boolean} - Whether the imports are for Node.js. Overridden by `.is_browser`. Inputs are assumed to be for eval if false.
	 * - `.special_function`: {@link function} - The function to execute upon startup and Vercengen initialisation.
	 *
	 * @returns Array<string>
	 */
	ve.start = function (arg0_options) { //[WIP] - Move Browser/Node/Eval selection to `.mode` optioning.
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Initialise options
		if (options.is_browser === undefined) options.is_browser = true;
		if (options.load_files === undefined) options.load_files = [];
		
		//Declare local instance variables
		let load_patterns = (!options.do_not_import_UF) ? [
			"!UF/archives",
			//"UF/js/vercengen/(vercengen_initialisation).js",
			"UF",
			"UF/js/vercengen/classes",
			"UF/js/vercengen/classes/Demo.js",
			"UF/js/vercengen/components",
		] : [];
			load_patterns = load_patterns.concat(options.load_files);
		
		let load_files = ve.getImportFiles(load_patterns);
		
		console.log(`[VERCENGEN] Importing ${load_files.length} files.`);
		
		//1. Handle browser <link>/<script> tags
		if (options.is_browser) {
			for (let i = 0; i < load_files.length; i++) {
				setTimeout(() => {
					let local_file_extension = path.extname(load_files[i]);
					let local_file_path = load_files[i];
					
					if (local_file_extension === ".css") {
						let link_el = document.createElement("link");
						link_el.setAttribute("rel", "stylesheet");
						link_el.setAttribute("type", "text/css");
						
						link_el.setAttribute("href", local_file_path);
						document.head.appendChild(link_el);
					}
					if (local_file_extension === ".js") {
						let script_el = document.createElement("script");
						script_el.setAttribute("type", "text/javascript");
						script_el.setAttribute("src", local_file_path);
						document.body.appendChild(script_el);
					}
				}, i);
			}
		}
		
		//2. Handle eval/Node.js require tags
		if (!options.is_browser) {
			for (let i = 0; i < load_files.length; i++) {
				let local_file_extension = path.extname(load_files[i]);
				let local_file_path = load_files[i];
				
				if (local_file_extension === ".js")
					if (options.is_node) {
						const local_library = require(local_file_path);
						
						//Destructure Node.js objects into global
						for (let [key, value] of Object.entries(local_library)) {
							if (global[key]) {
								console.error(`${key} is already a defined function namespace; ${local_file_path} is attempting an override. The present function is as follows:`, global[key]);
								continue;
							}
							global[key] = value;
						}
					} else {
						eval(fs.readFileSync(local_file_path, "utf8"));
					}
			}
		}
		
		//Initialise ve after import
		global.initialise_ve_loop = setInterval(function(){
			try {
				ve.initialise();
				clearInterval(global.initialise_ve_loop);
				
				if (options.special_function)
					options.special_function();
			} catch (e) {}
		}, 100);
		
		//Return statement
		return load_files;
	};
}