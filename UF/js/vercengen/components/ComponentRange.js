ve.ComponentRange = class veRange extends ve.Component {
	static demo_value = 0.50;
	
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = Math.returnSafeNumber(arg0_value);
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Initialise options
		options.atributes = (options.attributes) ? options.attributes : {};
		
		//Declare local instance variables
		let attributes = {
			readonly: options.disabled,
			max: (options.max !== undefined) ? options.max : 1,
			min: (options.min !== undefined) ? options.min : 0,
			step: (options.step !== undefined) ? options.step : 0.01,
			...options.attributes
		};
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-range");
			this.element.instance = this;
		HTML.applyCSSStyle(this.element, options.style);
		
		this.value = value;
		
		//Format HTML string
		let html_string = [];
		html_string.push(`<span id = "name"></span>`);
		html_string.push(`<input type = "range"${HTML.objectToAttributes(attributes)}>`);
		html_string.push(`<span id = "value-label"></span>`);
		
		//Populate element and initialise handlers
		this.element.innerHTML = html_string.join("");
		
		let input_el = this.element.querySelector("input");
		input_el.addEventListener("input", (e) => {
			this.v = global.Number(e.target.value);
		});
		this.name = options.name;
		this.v = this.value;
	}
	
	get name () {
		//Return statement
		return this.element.querySelector(`#name`).innerHTML;
	}
	
	set name (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
		
		//Set name
		this.element.querySelector(`#name`).innerHTML = (value) ? `${value} ` : "";
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
		this.element.querySelector("#value-label").innerHTML = `${this.value}`;
		if (this.options.onchange) this.options.onchange(this.value);
	}
	
	remove () {
		this.element.remove();
	}
	
	//Class methods
	toString () {
		return String(this.value);
	}
	
	valueOf () {
		return this.value;
	}
};