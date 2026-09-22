//Import Node.js libraries
global.fs = require("fs");
global.path = require("path");


//Initialise functions
{
	/**
	 * @namespace global
	 */
	if (!global) global = {};
	if (!global.ve)
		/**
		 * The root namespace for all Vercengen classes and options.
		 * 
		 * @namespace ve
		 */
		global.ve = {
			/**
			 * @type {number}
			 */
			start_timestamp: new Date().getTime(),
			
			/**
			 * Registry is initialised from {@link global.ve_registry} if it exists. Otherwise, default settings are used across Vercengen.
			 * @type {Object}
			 */
			registry: (global.ve_registry) ? global.ve_registry : {
				/**
				 * Whether to enable heuristic free.
				 * @type {boolean}
				 */
				debug_heuristic_free: false,
				
				/**
				 * The number of seconds after program-start to target {@link ve.Component}/{@link ve.Feature} with heuristic free.
				 * @type {number}
				 */
				debug_heuristic_free_start: 0,
				
				/**
				 * The number of seconds from the current timestamp to target {@link ve.Component}/{@link ve.Feature} with heuristic free.
				 * @type {number}
				 */
				debug_heuristic_free_end: 5,
				
				/**
				 * Determines whether to run linters at runtime.
				 * @type {boolean}
				 */
				debug_mode: false,
				/**
				 * Whether to profile {@link ve.Component}. Can be memory-intensive.
				 * @type {boolean}
				 */
				debug_profile_components: false,
				
				/**
				 * @type {{"<component_key>": ve.Component}}
				 */
				components: {},
				/**
				 * @type {{"<feature_key>": ve.Feature}}
				 */
				features: {},
				/**
				 * Defaults to '' for EN-GB
				 * @type {string}
				 */
				locale: "",
				/**
				 * Localisation strings used inside of Vercengen.
				 * @type {Object}
				 */
				localisation: {},
				/**
				 * Theme keys hold Telestyle CSS objects.
				 * @type {{"<theme_key>": Object}}
				 */
				themes: {},
				
				settings: {
					/**
					 * Whether names can be automatically imputed from the key name. False by default.
					 * @type {boolean}
					 */
					automatic_naming: false,
					
					//Component-wide settings
					
					Blacktraffic: {
						/**
						 * The folder path in which Ontology databases are stored.
						 * @type {string}
						 */
						ontology_saves_folder: "settings/Blacktraffic_ontology/",
						/**
						 * The folder path where worker statuses are stored.
						 * @type {string}
						 */
						worker_saves_folder: "settings/Blacktraffic_workers/"
					},
					
					Channel: {
						/**
						 * The default background colour for consoles.
						 * @type {string}
						 */
						default_bg_colour: "#2196f3",
						/**
						 * The default text colour for consoles. Either 'auto' or on actual colour.
						 * @type {string}
						 */
						default_text_colour: "auto"
					},
					
					Date: {
						/**
						 * Whether to disable caching timestamps for faster repeat conversion.
						 * @type {boolean}
						 */
						do_not_cache_timestamps: false
					},
					
					Log: {
						/**
						 * Determines the default console height.
						 * @type {string}
						 */
						default_console_height: "40vh"
					},
					
					/**
					 * Component settings for {@link ve.MultiTag}.
					 * @type {{"<registry_key>": string[]}}
					 */
					MultiTag: {
						global: []
					},
					
					NodeEditor: {
						/**
						 * Any window that is currently open to define a script type.
						 * @type {ve.Window|undefined}
						 */
						script_window: undefined,
						/**
						 * Either false if no automatic save file is declared, or the file path to save settings in.
						 * @type {boolean|string}
						 */
						save_file: "settings/NodeEditor_settings.json"
					},
					
					/**
					 * Component settings for {@link ve.ScriptManager}.
					 */
					ScriptManager: {
						/**
						 * Either false if no automatic save file is declared, or the file path to save settings in.
						 * @type {boolean|string}
						 */
						save_file: "settings/ScriptManager_settings.json",
						/**
						 * Determines whether `._settings` are shared between instances of {@link ve.ScriptManager}.
						 * @type {boolean}
						 */
						share_settings_across_instances: true
					},
					
					/**
					 * Component settings for {@link ve.Table}.
					 */
					Table: {
						/**
						 * Determines max. items per page in dropdown
						 * @type number[]
						 */
						page_sizes: [10, 20, 50, 100]
					},
					
					/**
					 * Component settings for {@link ve.UndoRedo}.
					 */
					UndoRedo: {
						/**
						 * Either false if no automatic save file is declared, or the file path to save settings in.
						 * @type {boolean|string}
						 */
						save_file: "settings/UndoRedo_settings.json",
						
						/**
						 * Whether manual commits are toggled on by default.
						 * @type {boolean}
						 */
						manual_commits: false,
						/**
						 * The default name for manual commits.
						 * @type {string} 
						 */
						manual_commit_name: ""
					}
				}
			}
		};
	
	/**
	 * Clears all Vercengen components from both state and DOM.
	 */
	ve.clear = function () {
		//Iterate over all ve classes and try to close them
		Object.iterate(ve, (local_key, local_value) => {
			if (typeof local_value === "function")
				if (local_value.instances) {
					for (let i = 0; i < local_value.instances.length; i++) {
						if (local_value.instances[i]?.close) try {
							local_value.instances[i].close();
						} catch (e) {}
						if (local_value.instances[i]?.remove) try {
							local_value.instances[i].remove();
						} catch (e) {}
					}
					
					local_value.instances = [];
				}
		});
	};
	
	/**
	 * Returns all non-evaluated files in a folder, so long as an evaluated set is provided.
	/**
	 * Recursively collects files in a folder adhering to exclusion options.
	 * @alias ve.getFilesInFolder
	 *
	 * @param {string} arg0_folder_path
	 * @param {Set<string>} [arg1_evaluated_set]
	 * @param {Object} [arg2_options]
	 *  @param {boolean} [arg2_options.all_extensions=false] - Whether to include all files instead of just code/style assets.
	 *  @param {string[]} [arg2_options.ignored_directories] - Directory names to skip.
	 *  @param {string[]} [arg2_options.ignored_directory_substrings] - Substrings of directory names to skip.
	 *  @param {string[]} [arg2_options.ignored_file_substrings] - Substrings of file names to skip (e.g. ['worker']).
	 *
	 * @returns {string[]}
	 */
	ve.getFilesInFolder = function (arg0_folder_path, arg1_evaluated_set, arg2_options) {
		//Convert from parameters
		let folder_path = arg0_folder_path;
		let evaluated_set = (arg1_evaluated_set) ? arg1_evaluated_set : new Set();
		let options = (arg2_options) ? arg2_options : {};
		
		//Initialise options
		if (!options.ignored_directories)
			options.ignored_directories = [
				"node_modules",
				"saves",
				"temp_jobs",
				"data_raw",
				"uud",
				"backups",
				"archives"
			];
		if (!options.ignored_directory_substrings)
			options.ignored_directory_substrings = ["_rasters", "rasters_", "worker"];
		if (!options.ignored_file_substrings)
			options.ignored_file_substrings = ["worker"];
		
		//Declare local instance variables
		let file_list;
		let return_files = [];
		
		//Use readdirSync and immediately sort the entry list
		//Strict ASCII sort ensures 'Forse.js' (dot) comes before 'Forse_conditionals.js' (_)
		try {
			file_list = fs.readdirSync(folder_path, { withFileTypes: true }).sort((a, b) => {
				if (a.name < b.name) return -1;
				if (a.name > b.name) return 1;
				return 0;
			});
		} catch (e) {
			//Return statement
			return return_files;
		}
		
		for (let local_file_entry of file_list) {
			let name = local_file_entry.name;
			let name_lower = name.toLowerCase();
			let full_path = path.join(folder_path, name);
			
			if (evaluated_set.has(full_path)) continue;
			evaluated_set.add(full_path);
			
			if (local_file_entry.isDirectory()) {
				//Skip hidden directories and configurable ignored directories
				if (name.startsWith(".")) continue;
				if (options.ignored_directories.some((d) => d.toLowerCase() === name_lower)) continue;
				
				let should_skip_directory = false;
				for (let i = 0; i < options.ignored_directory_substrings.length; i++)
					if (name_lower.includes(options.ignored_directory_substrings[i].toLowerCase())) {
						should_skip_directory = true;
						break;
					}
				if (should_skip_directory) continue;
				
				return_files = return_files.concat(
					ve.getFilesInFolder(full_path, evaluated_set, options)
				);
			} else {
				let should_skip_file = false;
				for (let i = 0; i < options.ignored_file_substrings.length; i++)
					if (name_lower.includes(options.ignored_file_substrings[i].toLowerCase())) {
						should_skip_file = true;
						break;
					}
				if (should_skip_file) continue;
				
				if (options.all_extensions) {
					return_files.push(full_path);
				} else {
					let ext = path.extname(name).toLowerCase();
					if (ext === ".js" || ext === ".css" || ext === ".mjs")
						return_files.push(full_path);
				}
			}
		}
		
		//Return statement
		return return_files;
	};
	
	/**
	 * Returns a string[] from a list of patterns. The last pattern
	 * to match a file determines its final position in the load order. This
	 * function iterates patterns in reverse to ensure that more specific
	 * patterns listed later correctly claim files from broader patterns
	 * listed earlier.
	 *
	 * @param {string[]} arg0_patterns The list of patterns to resolve.
	 * @param {Object} [arg1_options]
	 *
	 * @returns {string[]} The final, ordered list of file paths.
	 */
	ve.getImportFiles = function (arg0_patterns, arg1_options) {
		//Convert from parameters
		let patterns = arg0_patterns;
		let options = (arg1_options) ? arg1_options : {};
		
		//Declare local instance variables
		let base = process.cwd();
		let excluded_paths = new Set();
		let final_files = [];
		let handled_paths = new Set();
		
		//Function body
		//Process patterns in reverse order (from last to first) to enforce last-match-wins
		for (let i = patterns.length - 1; i >= 0; i--) {
			let pattern = patterns[i];
			let is_exclusion = pattern.startsWith("!");
			if (is_exclusion)
				pattern = pattern.slice(1);
			
			let files = [];
			if (pattern.includes("*") || pattern.includes("?")) {
				files = ve.getWildcardsInFolder(base, pattern, options);
			} else {
				let absolute_path = path.resolve(base, pattern);
				if (fs.existsSync(absolute_path)) {
					if (fs.statSync(absolute_path).isDirectory()) {
						files = ve.getFilesInFolder(absolute_path, new Set(), options);
					} else {
						files = [absolute_path];
					}
				}
			}
			
			//Prepend files in reverse order to maintain correct directory ordering
			for (let j = files.length - 1; j >= 0; j--) {
				let local_file = files[j];
				
				if (is_exclusion) {
					excluded_paths.add(local_file);
				} else {
					if (!handled_paths.has(local_file)) {
						final_files.unshift(local_file);
						handled_paths.add(local_file);
					}
				}
			}
		}
		
		//Final pass: filter out any files that were explicitly excluded
		let resolved_files = final_files.filter((file) => !excluded_paths.has(file));
		
		//Return statement
		return resolved_files;
	};
	
	/**
	 * Returns the absolute file paths of all wildcards within a given folder.
	 *
	 * @param {string} arg0_folder_path
	 * @param {string} arg1_wildcard_pattern
	 * @param {Object} [arg2_options]
	 *
	 * @returns {Array<string>}
	 */
	ve.getWildcardsInFolder = function (arg0_folder_path, arg1_wildcard_pattern, arg2_options) {
		//Convert from parameters
		let folder_path = arg0_folder_path;
		let wildcard_pattern = arg1_wildcard_pattern;
		let options = (arg2_options) ? arg2_options : {};
		
		//Declare local instance variables
		let normalized_pattern = wildcard_pattern.replace(/\\/g, "/").replace(/^\.\//, "");
		
		//Guard clause: no wildcards present
		if (!normalized_pattern.includes("*") && !normalized_pattern.includes("?")) {
			let absolute_path = path.resolve(folder_path, normalized_pattern);
			
			if (fs.existsSync(absolute_path)) {
				if (fs.statSync(absolute_path).isDirectory())
					return ve.getFilesInFolder(absolute_path, new Set(), options);
				return [absolute_path];
			}
			return [];
		}
		
		//Function body
		let first_wildcard = normalized_pattern.search(/[*?]/);
		let prefix = normalized_pattern.slice(0, first_wildcard);
		let last_slash = prefix.lastIndexOf("/");
		let search_dir = (last_slash !== -1) ? path.resolve(folder_path, prefix.slice(0, last_slash)) : folder_path;
		
		if (!fs.existsSync(search_dir) || !fs.statSync(search_dir).isDirectory())
			return [];
		
		let subpattern = (last_slash !== -1) ? normalized_pattern.slice(last_slash + 1) : normalized_pattern;
		
		//Fast path: single directory file wildcard without recursive subdirectories
		if (!subpattern.includes("/") && !subpattern.includes("**")) {
			let regex = new RegExp("^" + subpattern.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\?/g, ".") + "$", "i");
			
			return fs.readdirSync(search_dir)
				.filter((f) => regex.test(f))
				.sort((a, b) => {
					if (a < b) return -1;
					if (a > b) return 1;
					return 0;
				})
				.map((f) => path.join(search_dir, f))
				.filter((f) => fs.existsSync(f) && fs.statSync(f).isFile());
		}
		
		//Recursive glob matching across subdirectories
		let files = ve.getFilesInFolder(search_dir, new Set(), options);
		let regex_str = "^";
		let i = 0;
		
		while (i < normalized_pattern.length) {
			let char = normalized_pattern[i];
			
			if (char === "*" && normalized_pattern[i + 1] === "*") {
				if (normalized_pattern[i + 2] === "/") {
					regex_str += "(?:.*\\/)?";
					i += 3;
				} else {
					regex_str += ".*";
					i += 2;
				}
			} else if (char === "*") {
				regex_str += "[^\\/]*";
				i++;
			} else if (char === "?") {
				regex_str += "[^\\/]";
				i++;
			} else if ("+?.()|[]{}^$".includes(char)) {
				regex_str += "\\" + char;
				i++;
			} else {
				regex_str += char;
				i++;
			}
		}
		
		if (!normalized_pattern.endsWith("/") && !normalized_pattern.endsWith("*")) {
			regex_str += "(?:\\/.*)?$";
		} else {
			regex_str += "$";
		}
		
		let full_regex = new RegExp(regex_str, "i");
		
		//Return statement
		return files.filter((f) => {
			let rel_path = path.relative(folder_path, f).replace(/\\/g, "/");
			return full_regex.test(rel_path);
		});
	};
	
	/**
	 * Initialises Vercengen and associated UF files.
	 */
	ve.initialise = function () {
		if (ve.is_not_browser) return; //Internal guard clause if this is not a browser context
		
		//Initialise UF handlers
		new DALS.Timeline(); //Initialise starting timeline
		HTML.initialise();
		
		ve.scene_el = document.createElement("div");
		ve.scene_el.id = "ve-scene";
		ve.scene_el.setAttribute("class", "ve scene");
		document.body.appendChild(ve.scene_el);
		
		ve.window_overlay_el = document.createElement("div");
		ve.window_overlay_el.id = "ve-overlay";
		ve.window_overlay_el.setAttribute("class", "ve overlay");
		document.body.appendChild(ve.window_overlay_el);
		setTimeout(() => {
			ve.Component.linter(); //Lint ve.Component library
			ve.Feature.linter(); //Lint ve.Feature library
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
	 * - `.ontology_function`: {@link function}(arg0_ontologies:{@link Array}<{@link Ontology}>) - The function to execute once Ontology instances are loaded from DBs.
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
		let browser_load_patterns = [
			"UF/libraries",
			"UF/libraries/blockly.js",
			"UF/libraries/bi_blockly/",
			"!UF/libraries/js2blocks.mjs",
			"UF/libraries/maptalks.js",
			"UF/libraries/mapbox-gl.js",
			"UF/libraries/mapbox-gl.css",
			"UF/libraries/maptalks.mapboxgl.min.js",
			"UF/libraries/maptalks.formats.js",
			"UF/libraries/dat.gui.min.js",
			"UF/libraries/three.min.js",
			"UF/libraries/maptalks.three.js",
			"UF/libraries/GLTFLoader.js",
			
			"UF/libraries/maptalksgl.js",
			
			//Leaflet
			"UF/libraries/leaflet.css",
			"UF/libraries/leaflet.js",
			"UF/libraries/leaflet_kmz.js",
			
			//Univer
			"UF/libraries/univer/react.production.min.js",
			"UF/libraries/univer/react-dom.production.min.js",
			"UF/libraries/univer/rxjs.umd.min.js",
			"UF/libraries/univer/univerjs.index.js",
			"UF/libraries/univer/univerjs.umd.index.js",
			"UF/libraries/univer/univer.en-US.js",
		];
		let load_patterns = (!options.do_not_import_UF) ? [
			"!UF/archives",
			"!UF/js/vercengen/db",
			"!UF/**/*worker*",
			"!**/*worker*",
			"UF",
			
			//Localisation
			"UF/js/vercengen/engine/vercengen_localisation.js",
			
			//Blockly/Maptalks
			...((options.is_browser) ? browser_load_patterns : []),
			
			//DALS, Vercengen Components
			"UF/js/dals/DALS.js",
			"UF/js/dals/Timeline.js",
			"UF/js/dals/Timeline_state.js",
			"UF/js/vercengen/engine",
			"UF/js/vercengen/engine/Demo.js",
			"UF/js/vercengen/components",
			//ve.DatavisSuite
			"UF/js/vercengen/components/ComponentDatavisSuite/ComponentDatavisSuite.js",
			"UF/js/vercengen/components/ComponentDatavisSuite/framework",
			"UF/js/vercengen/components/ComponentDatavisSuite/ui",
			//ve.FileExplorer
			"UF/js/vercengen/components/ComponentFileExplorer/file_operations_ui.js",
			//ve.NodeEditor
			"UF/js/vercengen/components/ComponentNodeEditor/ComponentNodeEditor.js",
			"UF/js/vercengen/components/ComponentNodeEditor/core/framework/forse/Forse.js",
			"UF/js/vercengen/components/ComponentNodeEditor/",
			//ve.ScriptManager
			"!UF/libraries/monaco/",
			"UF/js/vercengen/components/ComponentScriptManager/blockly/blockly_toolbox.js",
			"UF/js/vercengen/components/ComponentScriptManager/core",
			"UF/js/vercengen/components/ComponentScriptManager/monaco/monaco_startup.js",
			//ve.Wiki
			"!UF/js/vercengen/components/ComponentWiki/wiki_preload.js",
			
			"UF/js/vercengen/features",
			
			//Vercengen-dependent imports
			//History
			"UF/js/date/History.js",
			
			...((options.is_browser) ? [] : [
				"!UF/libraries",
				"!UF/js/ontology",
				"!UF/js/vercengen/components",
				"!UF/js/vercengen/features",
				"UF/libraries/turf.min.js"
			])
		] : [];
			load_patterns = load_patterns.concat(options.load_files);
		ve.is_not_browser = (!options.is_browser);
		
		let load_files = ve.getImportFiles(load_patterns, options);
		
		if (!ve.is_not_browser && ve.debug_mode)
			console.log(`[VERCENGEN] Importing ${load_files.length} files.`, load_files);
		
		//1. Handle browser <link>/<script> tags
		if (options.is_browser) { //[WIP] - Refactor at a later date
			// Build up the full HTML snippet for all files in order
			let html_concat = "";
			
			for (let i = 0; i < load_files.length; i++) {
				let local_file_path = load_files[i];
				let local_file_extension = path.extname(local_file_path).toLowerCase();
				
				// Each file becomes HTML markup in correct order
				if (local_file_extension === ".css") {
					html_concat += `<link rel="stylesheet" type="text/css" href="${local_file_path}">`;
				} else if (local_file_extension === ".js") {
					html_concat += `<script type="text/javascript" src="${local_file_path}"></` + `script>`;
				}
			}
			
			//Inject all tags via HTML concatenation
			injectConcatenatedHTML(html_concat);
		}
		
		//2. Handle eval/Node.js require tags
		if (!options.is_browser) {
			for (let i = 0; i < load_files.length; i++) {
				let local_file_extension = path.extname(load_files[i]);
				let local_file_path = load_files[i];
				
				if (local_file_extension === ".js")
					if (options.is_node) {
						let local_library = require(local_file_path);
						
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
				ve.initialiseThemes();
				ve.initialise();
				
				//Load ontologies
				Ontology.fromDatabase().then(() => {
					if (options.ontology_function)
						options.ontology_function(Ontology.instances);
				});
				global.ve_gc_loop = setInterval(() => {
					//Perform GC
					if (ve?.Tooltip?.refresh) ve.Tooltip.refresh();
					ve.gc();
				}, 1000);
				
				clearInterval(global.initialise_ve_loop);
				
				if (options.special_function)
					options.special_function();
			} catch (e) {}
		}, 100);
		
		//Return statement
		return load_files;
	};
}

//[WIP] - Refactor later
function injectConcatenatedHTML (htmlMarkup) {
	const tempContainer = document.createElement("div");
	tempContainer.innerHTML = htmlMarkup;
	
	const head = document.head || document.getElementsByTagName("head")[0];
	const body = document.body || document.getElementsByTagName("body")[0];
	
	const fragment = document.createDocumentFragment();
	
	[...tempContainer.children].forEach((el) => {
		if (el.tagName === "SCRIPT") {
			const script = document.createElement("script");
			script.src = el.getAttribute("src");
			script.type = el.type || "text/javascript";
			script.async = false; // preserves order!
			fragment.appendChild(script);
		} else if (el.tagName === "LINK") {
			fragment.appendChild(el);
		}
	});
	
	body.appendChild(fragment);
}