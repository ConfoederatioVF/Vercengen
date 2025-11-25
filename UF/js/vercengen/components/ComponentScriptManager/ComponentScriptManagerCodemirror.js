ve.ScriptManagerCodemirror = class extends ve.Component {
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = arg0_value;
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		
		//Declare local instance variables
		this.element = document.createElement("div");
		this.element.instance = this;
		this.element.setAttribute("component", "ve-script-manager-codemirror");
		this.element.style.width = "100%";
			this.codemirror_el = document.createElement("textarea");
			this.codemirror_el.id = "codemirror";
			this.element.appendChild(this.codemirror_el);
		this.options = options;
		this.value = value;
		
		//Load CodeMirror once DOM populates
		this.codemirror_initialisation_loop = setInterval(() => {
			if (!document.body.contains(this.element)) return;
			this.codemirror = CodeMirror.fromTextArea(this.codemirror_el, {
				foldGutter: true,
				lineNumbers: true,
				lineWrapping: true,
				mode: "javascript",
				theme: "nord",
				gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
			});
			this.codemirror.setSize(null, "100%");
			this.codemirror.setOption("keyMap", "sublime");
			
			this.codemirror.on("change", (e) => {
				try {
					if (!this.to_binding_fire_silently) {
						let blockly_obj = this.element.parentElement.querySelector(`[component="ve-script-manager-blockly"]`).instance;
						
						blockly_obj.to_binding_fire_silently = true;
						blockly_obj.v = e.doc.getValue();
						this.fireToBinding();
					}
				} catch (e) { console.warn(e); }
			});
			clearInterval(this.codemirror_initialisation_loop);
		}, 100);
	}
	
	get v () {
		//Return statement
		return this.codemirror.doc.getValue();
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
		
		//Set codemirror value
		this.codemirror.setValue(value);
		this.fireFromBinding();
	}
};

//Functional binding

/**
 * @returns {ve.ScriptManagerCodemirror}
 */
veScriptManagerCodemirror = function () {
	//Return statement
	return new ve.ScriptManagerCodemirror(...arguments);
};