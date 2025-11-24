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
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-script-manager");
			this.element.instance = this;
			
			//Format html_string
			let html_string = [];
			
			html_string.push(`<span id = "name"></span>`);
			this.element.innerHTML = html_string.join("");
		
			this.container_el = document.createElement("div");
			this.container_el.id = "container";
			this.container_el.style.display = "flex";
			this.container_el.style.flexDirection = "row";
			
			this.leftbar_el = document.createElement("div");
			this.leftbar_el.id = "leftbar";
				this.leftbar_file_explorer = new ve.FileExplorer(__dirname, {
					load_function: (arg0_data) => {
						let local_data = arg0_data;
						
						try {
							this.v = local_data;
							this.fireToBinding();
						} catch (e) {
							this.throwLoadError(e);
						}
					},
					save_extension: ".js",
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
			
			this.container_el.append(this.topbar_el, this.leftbar_el, this.scene_el);
		this.element.appendChild(this.container_el);
		this.options = options;
		
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
	
	throwLoadError (arg0_error) {
		//Convert from parameters
		let error = arg0_error;
		
		//Instantiate load message popup
		veWindow(`Are you sure this file is compatible? Blockly has been disabled, and the file is only editable via CodeMirror.<br><br><div style = "align-items: center; display: flex;"><icon>warning</icon>&nbsp;${error}</div><br><b>Stack Trace:</b><br><div style = "margin-left: 1rem;">${error.stack}</div>`, { name: `Error Reading File`, width: "24rem" });
	}
};