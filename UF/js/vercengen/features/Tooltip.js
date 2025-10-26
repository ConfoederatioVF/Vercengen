/**
 * Represents a Tooltip Feature that contains a set of components which are wrapped inside an Interface.
 * @type {ve.Tooltip}
 * 
 * ##### DOM:
 * - `.instance`: this:{@link ve.Tooltip}
 * 
 * ##### Options:
 * - `arg0_components_obj`: {@link function}|{@link Object}<{@link ve.Component}>|{@link string}
 * - `arg1_options`: {@link Object}
 *   - `attributes`: {@link Object}<{@link string}>
 *   - `element`: {@link HTMLElement}|{@link string} - The anchor element that ve.Tooltip should be bound to.
 *   - `style`: {@linK Object}<{@link string}>
 */
ve.Tooltip = class extends ve.Feature {
	constructor (arg0_components_obj, arg1_options) {
		//Convert from parameters
		let components_obj = arg0_components_obj;
		let options = (arg1_options) ? arg1_options : {};
			super(components_obj, options);
		
		//Initialise options
		if (options.element === undefined)
			console.error(`arg1_options.element needs to be defined for ve.Tooltip to work.`);
		
		//Declare local instance variables
		this.anchor_element = (typeof options.element === "string") ? 
			document.querySelector(options.element) : options.element;
		this.element = document.createElement("div");
			this.element.instance = this;
		HTML.setAttributesObject(this.element, (options.attributes) ? options.attributes : {});
		HTML.applyTelestyle(this.element, options.value);
		this.v = components_obj;
		
		//Set tippy tooltip based on element
		tippy(this.anchor_element, { allowHTML: true, content: this.element, interactive: true });
	}
	
	get v () {
		//Return statement
		return this.element;
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let components_obj = arg0_value;
		
		//Reset innerHTML
		this.element.innerHTML = "";
		
		//Append components_obj if possible
		if (typeof components_obj === "function")
			components_obj = components_obj(this); //Fetch return value if possible
		if (typeof components_obj === "object") {
			//Iterate over all components in components_obj
			Object.iterate(components_obj, (local_key, local_value) => {
				this.element.appendChild(local_value.element);
			});
		} else if (typeof components_obj === "string") {
			this.element.innerHTML = components_obj;
		}
	}
};