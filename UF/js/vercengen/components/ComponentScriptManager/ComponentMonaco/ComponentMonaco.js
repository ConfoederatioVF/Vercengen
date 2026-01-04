ve.Monaco = class extends ve.Component {
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
			this.element.setAttribute("component", "ve-monaco");
			this.element.style.position = "relative";
			this.element.style.width = "100%";
			HTML.setAttributesObject(this.element, options.attributes);
		this.options = options;
		
		//Initialise Monaco
		require(["vs/editor/editor.main"], () => {
			
		});
		
		this.from_binding_fire_silently = true;
		this.v = value;
		delete this.from_binding_fire_silently;
	}
};