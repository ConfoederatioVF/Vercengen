ve.Time = class veTime extends ve.Component {
	static demo_value = { hour: 10, minute: 10 };
	
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value !== undefined) ? arg0_value : {
			hour: 0,
			minute: 0
		};
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		
		//Declare local instance variables
		let attributes = {
			readonly: options.disabled,
			max: options.max,
			min: options.min,
			...options.attributes
		};
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-time");
			this.element.instance = this;
		HTML.applyCSSStyle(this.element, options.style);
		
		this.value = value;
		
		//Format html_string
		let html_string = [];
		html_string.push(`<span id = "name"></span> `);
		html_string.push(`<input type = "time"${HTML.objectToAttributes(attributes)}>`);
		
		//Populate element and initialise handlers
		this.element.innerHTML = html_string.join("");
		
		let input_el = this.element.querySelector("input");
		input_el.addEventListener("input", (e) => {
			let split_value = e.target.value.split(":");
			
			this.v = { hour: parseInt(split_value[0]), minute: parseInt(split_value[1]) };
		});
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
		this.element.querySelector(`#name`).innerHTML = (value) ? value : "";
	}
	
	get v () {
		//Declare local instance variables
		let split_value = this.element.querySelector("input").value.split(":");
		
		//Return statement
		return {
			hour: parseInt(split_value[0]),
			minute: parseInt(split_value[1])
		};
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
		
		//Set value and update UI
		this.value = value;
		this.element.querySelector("input").value = `${value.hour.toString().padStart(2, "0")}:${value.minute.toString().padStart(2, "0")}`;
		if (this.options.onchange) this.options.onchange(this.value);
	}
	
	remove () {
		this.element.remove();
	}
};