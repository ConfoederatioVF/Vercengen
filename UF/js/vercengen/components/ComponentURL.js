ve.URL = class veURL extends ve.Component {
	static demo_value = "https://confoederatio.org";
	
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value !== undefined) ? arg0_value : "";
		let options = (arg1_options) ? arg1_options : {};
		super(options);
		
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		
		//Declare local instance variables
		let attributes = {
			readonly: options.disabled,
			...options.attributes
		};
		this.element = document.createElement("div");
		this.element.setAttribute("component", "ve-url");
		this.element.instance = this;
		HTML.applyCSSStyle(this.element, options.style);
		
		this.value = value;
		
		//Format html_string
		let html_string = [];
		html_string.push(`<span id = "name"></span> `);
		html_string.push(`<input type = "url"${HTML.objectToAttributes(attributes)}>`);
		html_string.push(` | <a id = "open-link">Open</a>`)
		
		//Populate element and initialise handlers
		this.element.innerHTML = html_string.join("");
		
		let input_el = this.element.querySelector("input");
		input_el.addEventListener("input", (e) => {
			this.v = global.String(e.target.value);
		});
		this.element.querySelector("#open-link").addEventListener("click", (e) => {
			if (this.value.isURL())
				require("electron").shell.openExternal(this.value);
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
		//Return statement
		return this.value;
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
		
		//Set value and update UI
		this.value = value;
		this.element.querySelector("input").value = this.value;
		this.element.querySelector(`#open-link`).setAttribute("valid-url", value.isURL());
		if (this.options.onchange) this.options.onchange(this.value);
	}
	
	remove () {
		this.element.remove();
	}
};