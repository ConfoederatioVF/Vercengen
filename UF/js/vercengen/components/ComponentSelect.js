/**
 * <span color = "yellow">{@link ve.Component}</span>: ve.Select
 * 
 * ##### Constructor:
 * - `arg0_value`: {@link Object}
 *   - `<select_key>`: {@link Object}|{@link string}
 *     - `.name`: {@link string}
 *     - `.selected`: {@link boolean}
 *   
 * @type {ve.Select}
 */
ve.Select = class veSelect extends ve.Component {
	static demo_value = {
		afghanistan: "Afghanistan",
		albania: {
			name: "Albania",
			selected: true
		},
		algeria: "Algeria",
		andorra: "Andorra"
	};
	static demo_options = {
		onchange: (e) => {
			if (ve.debug_mode)
				console.log(`ve.Select: Changed selection to:`, e);
		}
	};
	
	constructor (arg0_value, arg1_options) {
		//Convert from arameters
		let value = arg0_value;
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
			this.element.setAttribute("component", "ve-select");
			this.element.instance = this;
		HTML.applyCSSStyle(this.element, options.style);
		
		this.value = value;
		
		//Format HTML string
		let html_string = [];
		html_string.push(`<span id = "name"></span>`);
		html_string.push(`<select>`);
			html_string.concat(this.generateHTML());
		html_string.push(`</select>`);
		
		//Populate element and initialise handlers
		this.element.innerHTML = html_string.join("");
		
		let input_el = this.element.querySelector("select");
		input_el.addEventListener("change", (e) => {
			let selected_id = this.element.querySelectorAll("option")[e.target.selectedIndex].id;
			this.v = global.String(selected_id);
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
		this.element.querySelector(`#name`).innerHTML = (value) ? `${value} ` : "";
	}
	
	get v () {
		//Return statement
		return this.element.querySelectorAll("option")[
			this.element.querySelector("select").selectedIndex
		].id;
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
		
		//Declare local instance variables
		if (typeof value === "object") {
			this.value = value;
			this.element.querySelector("select").innerHTML = this.generateHTML().join("");
			Object.iterate(this.value, (local_key, local_value) => {
				if (local_value.selected)
					this.element.querySelector(`option[id="${local_key}"]`).selected = true;
			});
		} else if (typeof value === "string") {
			this.element.querySelector(`option[id="${value}"]`).selected = true;
		}
		
		if (this.options.onchange) this.options.onchange(this.v);
	}
	
	generateHTML () {
		//Declare local instance variables
		let html_string = [];
		
		//Iterate over this.value
		if (typeof this.value === "object")
			Object.iterate(this.value, (local_key, local_value) => {
				if (typeof local_value === "object") {
					html_string.push(`<option id = "${local_key}">${local_value.name}</option>`);
				} else {
					html_string.push(`<option id = "${local_key}">${local_value}</option>`);
				}
			});
		
		//Return statement
		return html_string;
	}
	
	remove () {
		this.element.remove();
	}
};