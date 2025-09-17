/**
 * <span color = "yellow">{@link Class}</span>:ComponentBasicColour
 *
 * ##### Instance:
 * - `.element`: {@link HTMLElement}
 * - `.options`: {@link Object}
 *   - `.name`: {@link string}
 *
 * - - `.attributes`: {@link Object}
 *   - `.onclick`: function({@link ve.ComponentBasicColourOnclickEvent})
 *
 * ##### Methods:
 * - <span color=#00ffff>{@link ve.ComponentBasicColour.getInput|getInput}</span> | {@link string}
 * - <span color=#00ffff>{@link ve.ComponentBasicColour.handleEvents|handleEvents}</span>
 * - <span color=#00ffff>{@link ve.ComponentBasicColour.setInput|setInput}</span>(arg0_value: {@link string})
 *
 * @type {ve.ComponentBasicColour}
 */
ve.ComponentBasicColour = class {
	constructor (arg0_options) {
		//Convert from parameters
		this.options = (arg0_options) ? arg0_options : {};
		
		//Declare local instance variables
		this.element = document.createElement("span");
		var html_string = [];
		var options = this.options;
		
		if (options.name)
			html_string.push(`<span>${options.name}</span> `);
		html_string.push(`<input type = "color" ${objectToAttributes(options.attributes)}>`);
		
		//Populate element and initialise handlers
		this.element.innerHTML = html_string.join("");
		this.handleEvents();
	}
	
	/**
	 * Returns a hex-coded string of the present Component's colour.
	 *
	 * @returns string
	 */
	getInput () {
		//Return statement
		return this.element.querySelector(`input[type="color"]`).value;
	}
	
	/**
	 * Extends {@link HTMLElement.prototype.onclick}
	 * - `.component`: this:{@link ve.ComponentBasicColour}
	 * - `.element`: {@link HTMLElement}
	 * - `.interface`: {@link ve.Interface}
	 * - `.state`: {@link ve.Interface.getState}
	 * - `.value`: {@link string} - The colour code as a hex value
	 *
	 * @typedef ve.ComponentBasicColourOnclickEvent
	 */
	
	/**
	 * Initialises event handlers for the present Component.
	 */
	handleEvents () {
		//Declare local instance variables
		var colour_input_el = this.element.querySelector(`input[type="color"]`);
		
		//Set handler
		if (this.options.onclick)
			colour_input_el.onchange = (e) => {
				e.component = this;
				e.element = this.element;
				e.interface = this.options.parent;
				e.state = this.options.parent.getState();
				e.value = e.target.value;
				
				this.options.onclick(e);
			}
	}
	
	/**
	 * Sets the value for the present Component as either an RGBA/hex string.
	 *
	 * @param {Array<number, number, number>|string} arg0_value
	 */
	setInput (arg0_value) {
		//Convert from parameters
		var value = arg0_value;
		if (value == undefined) return;
		
		//Declare local instance variables
		var input_el = this.element.querySelector(`input[type="color"]`);
		
		if (Array.isArray(value)) {
			input_el.value = RGBToHex(value);
		} else if (typeof value == "string") {
			input_el.value = value;
		}
	}
};