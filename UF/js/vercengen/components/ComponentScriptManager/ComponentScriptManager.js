ve.ScriptManager = class extends ve.Component {
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = arg0_value;
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		if (options.name === undefined) options.name = "ScriptManager";
		
		//Declare local instance variables
		this._codemirror_theme = "nord";
		this._codemirror_themes = {
			"3024-day": "3024-day",
			"3024-night": "3024-night",
			"abbott": "Abbott",
			"abcdef": "abcdef",
			"ambiance-mobile": "Ambiance Mobile",
			"ambiance": "Ambiance",
			"ayu-dark": "Ayu Dark",
			"ayu-mirage": "Ayu Mirage",
			"base16-dark": "base16-dark",
			"base16-light": "base16-light",
			"bespin": "Bespin",
			"blackboard": "Blackboard",
			"cobalt": "Cobalt",
			"colorforth": "Colourforth",
			"darcula": "Darcula",
			"default": "Default",
			"dracula": "Dracula",
			"duotone-dark": "Duotone Dark",
			"duotone-light": "Duotone Light",
			"eclipse": "Eclipse",
			"elegant": "Elegant",
			"erlang-dark": "Erlang-dark",
			"gruvbox-dark": "Gruvbox-dark",
			"hopscotch": "Hopscotch",
			"icecoder": "Icecoder",
			"idea": "Idea",
			"isotope": "Isotope",
			"juejin": "Juejin",
			"lesser-dark": "Lesser-dark",
			"liquibyte": "Liquibyte",
			"lucario": "Lucario",
			"material-darker": "Material Darker",
			"material-ocean": "Material Ocean",
			"material-palenight": "Material Palenight",
			"material": "Material",
			"mbo": "mbo",
			"mdn-like": "mdn-like",
			"midnight": "Midnight",
			"monokai": "Monokai",
			"moxer": "Moxer",
			"neat": "Neat",
			"neo": "Neo",
			"night": "Night",
			"nord": "Nord",
			"oceanic-next": "Oceanic Next",
			"panda-syntax": "Panda Syntax",
			"paraiso-dark": "Paraiso Dark",
			"paraiso-light": "Paraiso Light",
			"pastel-on-dark": "Pastel on Dark",
			"railscasts": "Railscasts",
			"rubyblue": "Rubyblue",
			"seti": "SETI",
			"shadowfox": "Shadowfox",
			"solarized": "Solarised",
			"ssms": "SSMS",
			"the-matrix": "The Matrix",
			"tomorrow-night-bright": "Tomorrow Night Bright",
			"tomorrow-night-eighties": "Tomorrow Night 80s",
			"ttcn": "TTCN",
			"twilight": "Twilight",
			"vibrant-ink": "Vibrant Ink",
			"xq-dark": "XQ Dark",
			"xq-light": "XQ Light",
			"yeti": "Yeti",
			"yonce": "Yonce",
			"zenburn": "Zenburn"
		};
		this.options = options;
		
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-script-manager");
			this.element.instance = this;
			this.element.style.padding = "0";
		
			this.container_el = document.createElement("div");
			this.container_el.id = "container";
			this.container_el.style.display = "flex";
			this.container_el.style.flexDirection = "row";
			
			this.leftbar_el = document.createElement("div");
			this.leftbar_el.id = "leftbar";
				this.leftbar_file_explorer = new ve.FileExplorer((this.options.folder_path) ? this.options.folder_path : __dirname, {
					load_function: (arg0_data, arg1_file_path) => {
						let local_data = arg0_data;
						let file_path = arg1_file_path;
						
						this._file_path = file_path;
						try {
							this.v = local_data;
							this.fireToBinding();
						} catch (e) {
							this.throwLoadError(e);
						}
					},
					save_extension: [".bat", ".css", ".html", ".md", ".mjs", ".js", ".json", ".txt"],
					save_function: () => {
						//Return statement
						return this.scene_codemirror.v;
					},
					style: { 
						overflow: "auto", width: "20rem"
					}
				});
				this.leftbar_file_explorer.bind(this.leftbar_el);
			this.scene_el = document.createElement("div");
			this.scene_el.style.display = "flex";
			this.scene_el.style.flexDirection = "row";
			this.scene_el.style.width = "100%";
			this.scene_el.id = "scene";
				this.scene_blockly = new ve.ScriptManagerBlockly();
				this.scene_blockly_el = this.scene_blockly.element;
					this.scene_blockly_el.id = "scene-blockly";
					this.scene_blockly_el.style.display = "block";
				this.scene_codemirror = new ve.ScriptManagerCodemirror();
					this.scene_codemirror_el = this.scene_codemirror.element;
					this.scene_codemirror_el.id = "scene-codemirror";
				this.scene_console_el = document.createElement("div");
					this.scene_console_el.id = "scene-console";
				this.scene_tabs_el = document.createElement("div");
					this.scene_tabs_el.id = "scene-tabs";
				
				this.scene_el.append(this.scene_blockly_el, this.scene_codemirror_el, this.scene_console_el, this.scene_tabs_el);
			this.topbar_el = document.createElement("div");
			this.topbar_el.id = "topbar";
				this.topbar_interface = new ve.RawInterface({
					name_el: new ve.HTML(() => `<span id = "name">${this.name}</span>${(!options.do_not_display_file_name) ? `<span id = "file-name"> | ${(this._file_path) ? this._file_path : "None"}</span>` : ""}`,
						{ style: { width: "20rem" } }),
					file: new ve.Button(() => {
						
					}, { name: "File" }),
					settings: new ve.Button(() => {
						
					}, { name: "Settings" }),
					view: new ve.Button(() => {
						//Populate themes_obj
						let themes_obj = {};
						
						Object.iterate(this._codemirror_themes, (local_key, local_value) => {
							themes_obj[local_key] = { name: local_value, selected: (this._codemirror_theme === local_key) }
						});
						
						let local_context_menu = new ve.ContextMenu({
							view_header: new ve.HTML(`<b>View Settings:</b><br><br>`, { x: 0, y: 0 }),
							
							editor_theme: new ve.Select({
								"theme-default": {
									name: "Default",
									selected: (!["theme-light"].includes(this._theme))
								},
								"theme-light": {
									name: "Light",
									selected: (this._theme === "theme-light")
								}
							}, {
								name: "Editor Theme",
								onchange: (v) => {
									console.log(v);
									this.setTheme(v);
								},
								style: {
									alignItems: "center",
									display: "flex"
								},
								x: 0, y: 1
							}),
							codemirror_theme: new ve.Select({
								...themes_obj
							}, {
								name: "Codemirror Theme",
								onchange: (v) => {
									console.log(v);
									this.setCodeEditorTheme(v);
								},
								x: 0, y: 2
							}),
							
							hide_blockly: new ve.Button(() => {
								this.scene_blockly.hide();
							}, { name: "Hide Blockly", limit: () => !this.scene_blockly._hidden, x: 0, y: 3 }),
							show_blockly: new ve.Button(() => {
								this.scene_blockly.show();
							}, { name: "Show Blockly", limit: () => this.scene_blockly._hidden, x: 0, y: 3 }),
							
							clear_blockly_workspace_on_error: new ve.Toggle(false, {
								name: "Clear Blockly on error"
							}, { x: 0, y: 4 }),
							display_load_errors: new ve.Toggle(true, {
								name: "Display load errors"
							})
						}, {
							id: "script_manager_view"
						});
					}, { name: "View", x: 0, y: 2 }),
					run: new ve.Button(() => {
						
					}, { name: "Run" }),
					console: new ve.Button(() => {
						
					}, { name: "Console" })
				}, { 
					no_name_element: true,
					is_folder: false,
					style: {
						alignItems: "center",
						display: "flex",
						padding: 0,
						
						"[component='ve-button']": {
							marginRight: "calc(var(--cell-padding)*2)"
						}
					}
				});
				this.topbar_interface.bind(this.topbar_el);
			
			this.element.appendChild(this.topbar_el);
			this.container_el.append(this.leftbar_el, this.scene_el);
		this.element.appendChild(this.container_el);
		
		//Initialisation loop for ScriptManager to ensure all requisite elements are loaded first
		this.scriptmanager_initialisation_loop = setInterval(() => {
			if (!document.body.contains(this.scene_blockly_el.querySelector("svg"))) return;
			let svg_el = this.scene_blockly_el.querySelector("svg");
			let svg_rect = svg_el.getBoundingClientRect();
			
			this.scene_codemirror_el.style.maxHeight = `${svg_rect.height}px`;
			this.leftbar_file_explorer.element.style.maxHeight = `${svg_rect.height}px`;
			
			clearInterval(this.scriptmanager_initialisation_loop);
		}, 100);
		
		//Populate element and initialise handlers
		this.name = options.name;
		
		this.from_binding_fire_silently = true;
		this.v = value;
		delete this.from_binding_fire_silently;
	}
	
	get v () {
		//Return statement
		return this.scene_codemirror.v;
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let local_value = (arg0_value) ? arg0_value : "";
		
		//Declare local instance variables
		let set_value_loop = setInterval(() => {
			if (this.scene_codemirror?.codemirror) try {
				//Set new code value
				this.scene_blockly.enable();
				js2blocks.parseCode(local_value);
				this.scene_codemirror.to_binding_fire_silently = true;
				this.scene_codemirror.v = local_value;
				delete this.scene_codemirror.to_binding_fire_silently;
				this.fireFromBinding();
				clearInterval(set_value_loop);
			} catch (e) {
				clearInterval(set_value_loop);
				this.throwLoadError(e);
				
				//Load the file anyway
				this.scene_blockly.disable();
				this.scene_codemirror.to_binding_fire_silently = true;
				this.scene_codemirror.v = local_value;
				delete this.scene_codemirror.to_binding_fire_silently;
				this.fireFromBinding();
			}
		});
	}
	
	setCodeEditorTheme (arg0_theme_class) {
		//Convert from parameters
		let theme_class = arg0_theme_class;
		
		//Declare local instance variables
		this._codemirror_theme = theme_class;
		this.scene_codemirror.codemirror.setOption("theme", theme_class);
	}
	
	setTheme (arg0_theme_class) {
		//Convert from parameters
		let theme_class = arg0_theme_class;
		
		//Remove previous themes
		if (this._theme)
			this.element.classList.remove(this._theme);
		this._theme = theme_class;
		
		//Apply new theme
		this.element.classList.add(this._theme);
		this.scene_blockly.setTheme(this._theme);
	}
	
	throwLoadError (arg0_error) {
		//Convert from parameters
		let error = arg0_error;
		
		//Instantiate load message popup
		veWindow(`Are you sure this file is ${(this.options.compatibility_message) ? this.options.compatibility_message : "ES6"} compatible? Blockly has been disabled, and the file is only editable via CodeMirror.<br><br><div style = "align-items: center; display: flex;"><icon>warning</icon>&nbsp;${error}</div><br><b>Stack Trace:</b><br><div style = "margin-left: 1rem;">${error.stack}</div>`, { name: `Error Reading File`, width: "24rem" });
	}
};