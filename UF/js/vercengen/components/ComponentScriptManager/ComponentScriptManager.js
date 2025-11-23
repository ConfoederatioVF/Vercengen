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
				this.leftbar_file_explorer = new ve.FileExplorer();
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
			
			this.container_el.append(this.leftbar_el, this.scene_el, this.topbar_el);
		this.element.appendChild(this.container_el);
		this.options = options;
		this.value = value;
		
		this.scriptmanager_initialisation_loop = setInterval(() => {
			if (!document.body.contains(this.scene_blockly_el.querySelector("svg"))) return;
			let svg_el = this.scene_blockly_el.querySelector("svg");
			let svg_rect = svg_el.getBoundingClientRect();
			
			this.scene_codemirror_el.style.maxHeight = `${svg_rect.height}px`;
			clearInterval(this.scriptmanager_initialisation_loop);
		}, 100);
		
		//Populate element and initialise handlers
		this.name = options.name;
	}
	
	get v () {
		
	}
	
	set v (arg0_value) {
		
	}
};