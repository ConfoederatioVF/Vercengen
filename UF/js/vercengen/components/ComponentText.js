ve.Text = class veText extends ve.Component {
	static demo_value = "Lorem ipsum dolor text amet";
	
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value !== undefined) ? arg0_value : "";
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		
		//Declare local instance variables
		let attributes = {
			disabled: options.disabled,
			size: options.length,
			maxlength: options.max,
			minlength: options.min,
			...options.attributes
		};
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-text");
			this.element.instance = this;
		HTML.applyTelestyle(this.element, options.style);
		this.options = options;
		this.value = value;
		
		//Format html_string
		let html_string = [];
		html_string.push(`<span id = "name"></span> `);
		html_string.push(`<input type = "text"${HTML.objectToAttributes(attributes)}>`);
		
		//Populate element and initialise handlers
		this.element.innerHTML = html_string.join("");
		
		let input_el = this.element.querySelector("input");
		input_el.addEventListener("change", (e) => {
			console.log(e);
			this.v = global.String(e.target.value);
			this.fireToBinding();
		});
		if (options.name) this.name = options.name;
		this.v = this.value;
	}
	
	get v () {
		//Return statement
		return this.value;
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
		
		//Set value and update UI
		this.value = value;
		this.element.querySelector("input").value = this.value;
		this.fireFromBinding();
	}
};