/**
 * Refer to <span color = "yellow">{@link ve.Component}</span> for methods or fields inherited from this Component's parent such as `.options.attributes` or `.element`.
 * 
 * ##### Constructor:
 * - `arg0_value`: {@link Object}
 *   - `<category_key>`: {@link Object}
 *     - `<category_key>`: {@link Object}
 *     - `<component_key>`: {@link ve.Component}
 *       - `.options`: {@link Object}
 *         - `.flex_disabled=false`: {@link boolean}
 *     - `.type="horizontal"` - Either 'horizontal'/'vertical'.
 *   - `.type="horizontal"` - Either 'horizontal'/'vertical'.
 * 
 * @type {ve.FlexInterface}
 */
ve.FlexInterface = class extends ve.Component { //[WIP] - Finish CSS and JS handlers
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = arg0_value;
		let options = (arg1_options) ? arg1_options : {};
			super(options);
		
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
			
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-flex-interface");
			HTML.setAttributesObject(this.element, options.attributes);
			this.element.instance = this;
		this.options = options;
		this.value = value;
		
		//Set .v
		this.v = this.value;
	}
	
	get v () {
		//Return statement
		return this.value;
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		
		//Set this.value and refresh flex interface
		this.value = value;
		this.element.innerHTML = "";
		this.element.appendChild(ve.FlexInterface.generateHTMLRecursively(undefined, this.value, {
			type: this.value.type
		}));
		this.fireFromBinding();
	}
	
	static generateHTMLRecursively (arg0_root_el, arg1_value, arg2_options) {
		//Convert from parameters
		let root_el = (arg0_root_el) ? arg0_root_el : document.createElement("flex");
		let value = (arg1_value) ? arg1_value : {};
		let options = (arg2_options) ? arg2_options : {};
		
		//Initialise value
		if (!value.type) value.type = "horizontal";
		
		//Modify root_el
		root_el.setAttribute("class", value.type);
		if (getComputedStyle(root_el).getPropertyValue("flex").length === 0)
			root_el.style.flex = "1";
		
		//Iterate over all keys in value
		Object.iterate(value, (local_key, local_value, local_index) => {
			let flex_item_el = document.createElement("flex-item");
				flex_item_el.style.flex = (local_index + 1).toString();
			let flex_resizer_el = document.createElement("flex-resizer");
			
			if (typeof local_value === "object" && local_key !== "options" && !(local_value instanceof ve.Component)) {
				if (!options.flex_disabled && local_index !== 0)
					root_el.appendChild(flex_resizer_el);
				
				let container_el = ve.FlexInterface.generateHTMLRecursively(undefined, local_value, local_value.options);
					root_el.appendChild(container_el);
			} else if (local_value instanceof ve.Component) {
				if (!options.flex_disabled && local_index !== 0)
					root_el.appendChild(flex_resizer_el);
				
				local_value.bind(flex_item_el);
				root_el.appendChild(flex_item_el);
			}
		});
		
		//Return statement
		return root_el;
	}
};