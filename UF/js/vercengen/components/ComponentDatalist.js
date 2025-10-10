/**
 * <span color = "yellow">{@link ve.Datalist}</san>:ve.Datalist
 * 
 * ##### Constructor:
 * - `arg0_value`: {@link Object}
 * - `arg1_options`: {@link Object}
 *   - `.attributes`: {@link Object}
 *     - `<attribute_key>`: {@link string}
 *   - `.name`: {@link string}
 *   - `.onchange`: {@link function}(this:{@link ve.Datalist})
 *   - `.style`: {@link Object}
 *     - `<style_key>`: {@link string}
 * 
 * ##### DOM:
 * - `.instance`: this:{@link ve.Datalist}
 * 
 * ##### Instance:
 * - `.element`: {@link HTMLElement}
 * - `.name`: {@link string}
 * - `.v`: {@link string}
 * 
 * ##### Methods:
 * - <span color=00ffff>{@link ve.Button.remove|remove}</span>()
 * 
 * @type {ve.Datalist}
 */
ve.Datalist = class veDatalist extends ve.Component {
	static demo_value = {
		"polygon": "Polygon",
		"line": "Line",
		"point": "Point"
	};
	static demo_options = {
		onchange: (e) => {
			console.log(`ve.Datalist:`, e);
		}
	};
	
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
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
			this.element.setAttribute("component", "ve-datalist");
			this.element.instance = this;
		HTML.applyCSSStyle(this.element, options.style);
		
		this.value = value;
		
		//Format HTML string
		let html_string = [];
		html_string.push(`<span id = "name"></span>`);
		
		html_string.push(`<input list = "datalist" type = "text"${HTML.objectToAttributes(attributes)}>`);
		html_string.push(`<datalist id = "datalist">`);
		html_string.push(`</datalist>`);
		
		//Populate element and initialise handlers
		this.element.innerHTML = html_string.join("");
		
		let input_el = this.element.querySelector("input");
		input_el.addEventListener("change", (e) => {
			this.v = e.target.value.toString();
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
		this.element.querySelector(`#name`).innerHTML = (value) ? value : "";
	}
	
	get v () {
		//Declare local instance variables
		let local_value = this.element.querySelector(`input[list="datalist"]`).value;
		
		let local_option = this.element.querySelector(`option[value="${local_value}"`);
		
		//Return statement
		return (local_option) ? local_option.innerHTML : local_value;
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
		
		//Declare local instance variables
		let html_string = [];
		
		if (typeof value === "object") {
			//Iterate over all keys in value and assign <option> tags to the datalist
			Object.iterate(value, (local_key, local_value) => {
				if (local_key === "selected") {
					this.element.querySelector(`input[type="text"]`).value = local_value;
				} else {
					html_string.push(`<option value = "${local_value}">${local_key}</option>`);
				}
			});
			this.element.querySelector("datalist").innerHTML = html_string.join("");
		} else if (typeof value === "string") {
			this.element.querySelector(`input[type="text"]`).value = value;
		}
		
		this.value = value;
		if (this.options.onchange) this.options.onchange(this);
	}
	
	/**
	 * Removes the component/element from the DOM.
	 *
	 * @typedef ve.Datalist.remove
	 */
	remove () {
		this.element.remove();
	}
};