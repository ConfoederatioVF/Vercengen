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
				lineNumbers: true,
				lineWrapping: true,
				mode: "javascript",
				theme: "nord"
			});
			this.codemirror.setSize(null, "100%");
			
			this.codemirror.on("change", (e) => {
				
				try {
					if (!this.to_binding_fire_silently)
						js2blocks.parseCode(e.doc.getValue());
				} catch (e) { /*console.warn(e);*/ }
			});
			clearInterval(this.codemirror_initialisation_loop);
		}, 100);
	}
};