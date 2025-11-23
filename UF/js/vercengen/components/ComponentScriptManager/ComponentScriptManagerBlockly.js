ve.ScriptManagerBlockly = class extends ve.Component {
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = arg0_value;
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		
		//Declare local instance variables
		let toolbox = ve.ScriptManager.toolbox;
		
		this.element = document.createElement("div");
		this.element.setAttribute("component", "ve-script-manager-blockly");
		this.element.style.width = "35%";
		this.element.style.position = "relative"; 
		this.options = options;
		this.value = value;
		
		//Initialise ScriptManagerBlockly element 
		document.body.appendChild(this.element);
		this.workspace = Blockly.inject(this.element, {
			toolbox: toolbox,
			zoom: {
				controls: true,
				wheel: true,
				startScale: 1.0,
				maxScale: 3,
				minScale: 0.2,
				scaleSpeed: 1.2
			},
			//trashcan: true
		});
		document.body.removeChild(this.element);
		this.blockly_widget_el = document.querySelector("body > .blocklyWidgetDiv");
		this.blockly_tooltip_el = document.querySelector("body > .blocklyTooltipDiv");
		this.blockly_toolbox_el = document.querySelector("body > .blocklyToolboxDiv");
		
		//Call after Blockly initialization
		this.interceptBlocklyTransforms();
		/*try {
			console.log(window.main.updateWorkspace);
			this.workspace.addChangeListener(window.main.updateWorkspace);
		} catch (e) { console.warn(e); }*/ //[WIP] - Fix when this is a valid method
		
		//Initialise onresize, flyout scaling fixes
		this.element.style.left = '0px' // x + 'px';
		this.element.style.width = "100%"
		this.element.style.height = "100%";
		
		this.fixBlocklyScaling();
		this.handleCSS();
	}
	
	fixBlocklyScaling () {
		//Declare local instance variables
		let flyout_bg_el = this.element.querySelector('.blocklyFlyoutBackground');
		let flyout_container_el = this.element.querySelector('.blocklyFlyout');
		
		//Fix flyout scaling - CSS fix
		if (flyout_bg_el && flyout_container_el) {
			//Get the actual flyout container dimensions
			let flyout_rect = flyout_container_el.getBoundingClientRect();
			
			let height = flyout_rect.height;
			let width = flyout_rect.width;
			
			//Set flyout_bg_el's dynamic path
			flyout_bg_el.setAttribute('d', `M 0,0 h ${width} a 8 8 0 0 1 8 8 v ${height - 16} a 8 8 0 0 1 -8 8 h -${width} z`);
		}
	}
	
	handleCSS () {
		this.element.style.width = "auto";
		this.update_css_loop = setInterval(() => {
			this.svg_el = this.element.querySelector("svg");
			this.svg_rect = this.svg_el.getBoundingClientRect();
			
			this.max_height = this.svg_rect.height;
			this.max_width = this.svg_rect.width;
			this.svg_el.style.maxHeight = `${this.max_height}px`;
			this.svg_el.style.maxWidth = `${this.max_width}px`;
		});
		
		//Handle blockly_toolbox_el
		//this.blockly_toolbox_el.style.zIndex = 2;
		this.blockly_toolbox_mode = "canvas"; //Either 'body'/'canvas'
		
		this.blockly_toolbox_loop = setInterval(() => {
			let rect = this.element.getBoundingClientRect();
			this.blockly_toolbox_mode = (this.element.querySelector(".blocklyFlyout:hover") ||
				this.blockly_toolbox_el.querySelector(":hover") ||
				document.querySelector(".blocklyDraggable:hover")
			) ? 
				"body" : "canvas";
			
			if (this.blockly_toolbox_mode === "body") {
				if (!document.querySelector("body > .blocklyToolboxDiv"))
					document.body.appendChild(this.blockly_toolbox_el);
				this.blockly_toolbox_el.style.height = `${this.svg_rect.height}px`;
				this.blockly_toolbox_el.style.left = `${rect.x}px`;
				this.blockly_toolbox_el.style.top = `calc(${rect.y}px + var(--cell-padding))`;
				this.blockly_toolbox_el.style.zIndex = 2;
			}
			if (this.blockly_toolbox_mode === "canvas") {
				if (!this.element.contains(this.blockly_toolbox_el))
					this.element.appendChild(this.blockly_toolbox_el);
				this.blockly_toolbox_el.style.color = "black";
				this.blockly_toolbox_el.style.height = `${this.svg_rect.height}px`;
				this.blockly_toolbox_el.style.left = "0px";
				this.blockly_toolbox_el.style.top = `calc(var(--cell-padding))`;
				this.blockly_toolbox_el.style.zIndex = 0;
			}
		});
	}
	
	interceptBlocklyTransforms () {
		//Declare local instance variables
		let targets = [
			'.blocklyFlyout .blocklyBlockCanvas',
			'.blocklyFlyout .blocklyBubbleCanvas'
		];
		
		//Iterate over all targets
		targets.forEach((selector) => {
			let local_element = this.element.querySelector(selector);
			
			if (local_element) {
				// Override setAttribute to intercept transform changes
				const originalSetAttribute = local_element.setAttribute;
				local_element.setAttribute = function (name, value) {
					if (name === 'transform' && value.includes('scale(')) {
						// Preserve translate, force scale(1)
						value = value.replace(/scale\([^)]+\)/g, 'scale(1)');
					}
					return originalSetAttribute.call(this, name, value);
				};
			}
		});
	}
};