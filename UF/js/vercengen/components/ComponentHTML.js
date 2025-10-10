ve.HTML = class veHTML extends ve.Component {
	static demo_value = (e) => `<b>Test HTML.</b> This is mock text. <kbd>Date:</kbd>${new Date()}`;
	
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = arg0_value;
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-html");
			this.element.instance = this;
		HTML.applyCSSStyle(this.element, options.style);
		this.options = options;
		this.value = value;
		
		//Set .v
		this.v = this.value;
	}
	
	get name () {
		//Declare local instance variables
		let name_el = this.element.querySelector(`#name`);
		
		//Return statement
		if (name_el)
			return this.element.querySelector(`#name`).innerHTML;
	}
	
	set name (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
		
		//Declare local instance variables
		let name_el = this.element.querySelector(`#name`);
		
		//Set name
		if (name_el)
			this.element.querySelector(`#name`).innerHTML = (value) ? value : "";
	}
	
	get v () {
		//Return statement
		return this.element;
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
		
		//Set value and update UI
		this.value = value;
		if (typeof this.value === "function") {
			if (this.draw_loop) {
				clearInterval(this.draw_loop);
				delete this.draw_loop;
			}
			this.draw_function = this.value;
			
			if (this.options.do_not_refresh !== true) {
				this.draw_loop = setInterval(() => {
					this.v = this.draw_function(this);
				}, 100);
			} else {
				this.v = this.draw_function(this);
			}
		} else if (typeof this.value === "object") {
			this.element.innerHTML = "";
			this.element.appendChild(this.value);
		} else {
			this.element.innerHTML = this.value;
		}
		if (this.options.onchange) this.options.onchange(this.element);
		this.value = this.element;
	}
	
	remove () {
		this.element.remove();
	}
	
	//Class methods
	toString () {
		return String(this.element.innerHTML);
	}
};