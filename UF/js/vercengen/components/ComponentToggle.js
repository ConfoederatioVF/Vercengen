/**
 * 
 * ##### Constructor:
 * - `arg0_value`: {@link boolean}
 * - `arg1_options`: {@link Object}
 *   - `.attributes`: {@link Object}
 *     - `<attribute_key>`: {@link string}
 *   - `.off_name="<icon>toggle_off</icon>"`: {@link string} - The HTML that displays when the toggle is off.
 *   - `.name`/`.on_name="<icon class = "toggle-icon">toggle_on</icon>"`: {@link string} - The HTML that displays when the toggle is on.
 *   - `.onchange`: {@link boolean}({@link ve.Toggle.v})
 *   - `.style`: {@link Object}
 *     - `<style_key>`: {@link string}
 * 
 * @type {ve.Toggle}
 */
ve.Toggle = class veToggle extends ve.Component {
	static demo_value = () => { window.alert("This is an alert from ve.Toggle."); };
	
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = arg0_value;
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		if (options.off_name === undefined) options.off_name = `<icon class = "toggle-icon off">toggle_off</icon>`;
		if (options.on_name === undefined) options.on_name = `<icon class = "toggle-icon on">toggle_on</icon>`;
		
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-toggle");
			this.element.instance = this;
			HTML.applyTelestyle(this.element, options.style);
		this.options = options;
		this.value = value;
		
		//Format HTML string
		let html_string = [];
		html_string.push(`<span id = "name"></span>`);
		
		//Populate element and initialise handlers
		this.element.innerHTML = html_string.join("");
		
		let toggle_el = this.element.querySelector("#name");
		toggle_el.addEventListener("click", (e) => {
			this.value = (!this.value);
			this.updateName();
			this.fireToBinding();
			e.stopPropagation();
		});
		this.name = options.on_name;
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
		this.updateName();
		this.fireFromBinding();
	}
	
	updateName () {
		//Set new this.name
		this.name = (this.v) ? this.options.on_name : this.options.off_name;
	}
};