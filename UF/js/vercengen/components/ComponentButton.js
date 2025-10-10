/**
 * <span color = "yellow">{@link ve.Component}</span>:ve.Button
 *
 * ##### Constructor:
 * - `arg0_value`: {@link function}(e:{@link MouseEvent})
 * - `arg1_options`: {@link Object}
 *   - `.attributes`: {@link Object}
 *     - `<attribute_key>`: {@link string}
 *   - `.name`: {@link string}
 *   - `.onchange`: {@link function}(this:{@link ve.Button})
 *   - `.style`: {@link Object}
 *     - `<style_key>`: {@link string}
 *     
 * ##### DOM:
 * - `.instance`: this:{@link ve.Button}
 * 
 * ##### Instance:
 * - `.element`: {@link HTMLElement}
 * - `.name`: {@link string}
 * - `.v`: {@link function}
 * 
 * ##### Methods:
 * - <span color=00ffff>{@link ve.Button.remove|remove}</span>()
 *
 * @function veButton
 * @type {ve.Button}
 */
ve.Button = class veButton extends ve.Component {
	static demo_value = () => { window.alert("This is an alert from ve.Button."); };
	
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = arg0_value;
		let options = (arg1_options) ? arg1_options : {};
			super(options);
		
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		if (options.name === undefined) options.name = "Confirm";
		
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-button");
			this.element.instance = this;
		HTML.applyCSSStyle(this.element, options.style);
		
		this.value = value;
		
		//Format HTML string
		let html_string = [];
		html_string.push(`<button>`);
			if (options.icon) html_string.push(`<img src = "${options.icon}">`);
			html_string.push(` <span id = "name"></span>`)
		html_string.push(`</button>`);
		
		//Poulate element and initialise handlers
		this.element.innerHTML = html_string.join("");
		
		let button_el = this.element.querySelector("button");
		button_el.addEventListener("click", (e) => {
			if (this.value) this.value(e);
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
		//Return statement
		return this.value;
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
		
		//Set value and update UI
		this.value = value;
		if (this.options.onchange) this.options.onchange(this);
	}
	
	/**
	 * Removes the component/element from the DOM.
	 * - Method of: {@link ve.Button}
	 * 
	 * @typedef ve.Button.remove
	 */
	remove () {
		this.element.remove();
	}
};