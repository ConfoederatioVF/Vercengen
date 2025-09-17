if (!global.ve) global.ve = {};

/**
 * Represents a Vercengen Component. Components are composition-based. These must be placed in Interfaces.
 *
 * Components are input types that allow for users to submit and change data. They directly alter state as defined by developer rulesets.
 *
 * ##### DOM:
 * - `.instance`: this:{@link ve.Component}
 *
 * ##### Instance:
 * - `.options`: <span color = "lime">{@link ve.Component.options}</span>
 * <br>
 * - `.element`: {@link HTMLElement}
 * - `.id="generic-component"`: {@link string}
 * - `.parent`: {@link ve.Interface}
 * - `.type`: <span color = "white">{@link ve.component_dictionary}</span>
 * <br>
 * - `.attributes`: {@link Object}
 * - `.height=1`: {@link number}
 * - `.width=1`: {@link number}
 * - `.x=0`: {@link number}
 * - `.y=0`: {@link number}
 *
 * @type {ve.Component}
 */
ve.Component = class {
	/**
	 * - `.id`: {@link string}
	 * - `.parent`: {@link ve.Interface}
	 * - `.placeholder`: {@link any}
	 * - `.type`: <span color = "white">{@link ve.component_dictionary}</span>
	 * <br>
	 * - `.attributes`: {@link Object}
	 * - `.tooltip`: {@link string}
	 * <br>
	 * - `.height=1`: {@link number}
	 * - `.width=1`: {@link number}
	 * - `.x=0`: {@link number}- The X position of the element in the current Interface.
	 * - `.y=n + 1`: {@link number} - The Y position of the element in a grid. n + 1 by default, where n = last row.
	 *
	 * @typedef {Object} ve.Component.options
	 *
	 * @property {function(HTMLElement.prototype.onclick)} [options.onclick] - The function to fire upon an onclick Event.
	 * @property {function(HTMLElement.prototype.onload)} [options.onload] - If this method returns an Object, the Component takes`options following that Object.
	 */
	constructor (arg0_parent, arg1_options) {
		//Convert from parameters
		var parent = arg0_parent; //Class: Interface
		var options = (arg1_options) ? arg1_options : {};
		
		//Set component state
		this.id = (options.id) ? options.id : "generic-component";
		this.name = (options.name) ? options.name : "";
		
		this.attributes = (options.attributes) ? options.attributes : undefined;
		this.height = returnSafeNumber(options.height, 1);
		this.width = returnSafeNumber(options.width, 1);
		this.x = returnSafeNumber(options.x);
		this.y = returnSafeNumber(options.y);
		
		{
			//Scaffold this.component
			var component_obj = ve.Component.createInput(options);
			if (!component_obj) console.error(`Invalid component type:`, options.type);
			
			//Onload handler
			if (options.onload) {
				var return_value = options.onload(component_obj.element);
				
				if (typeof return_value == "object") {
					//console.log(`Return value:`, {...options, ...return_value });
					//component_obj = ve.Component.createInput(return_value);
					component_obj = ve.Component.createInput({ ...options, ...return_value });
					//console.log(component_obj)
				}
			}
			
			this.component = component_obj; //Set this.component alias for internal referencing; same as this.element
			this.element = component_obj;
		}
		
		//Set recursive trackers
		this.parent = parent;
		
		//this.component handling for both non-element and element returns
		var local_td_el = document.createElement("td");
		if (options.height) local_td_el.setAttribute("rowspan", options.height);
		if (options.width) local_td_el.setAttribute("colspan", options.width);
		
		if (typeof this.component == "object") {
			var local_context_menu_cell = document.createElement("div");
			local_context_menu_cell.setAttribute("id", options.id);
			local_context_menu_cell.setAttribute("class", "context-menu-cell");
			local_context_menu_cell.setAttribute("type", options.type);
			
			local_context_menu_cell.appendChild(this.component.element);
			local_td_el.appendChild(local_context_menu_cell);
			
			//Bindings handling
			{
				//Attach .instance whereever available
				local_context_menu_cell.instance = component_obj;
			}
		} else if (typeof this.component == "string") {
			local_td_el.innerHTML = JSON.parse(JSON.stringify(this.component));
		}
		
		//Reset this.component to be an actual HTMLElement
		var component_row = parent.table_rows[options.y];
		var component_x = (options.x != undefined) ? options.x : component_row.length;
		
		this.component = local_td_el;
		component_row[component_x] = this.component;
	}
	
	/**
	 * Functions as a helper constructor for the present Component.
	 * @param {ve.Component.options} [arg0_options]
	 *
	 * @returns {ve.Component}
	 */
	static createInput (arg0_options) {
		//Convert from parameters
		var options = (arg0_options) ? arg0_options : {};
		
		//Initialise options
		if (!options.attributes) options.attributes = {};
		if (!options.options) options.options = {};
		if (!options.options.VALUE) {
			if (options.attributes.value)
				options.options.VALUE = options.attributes.value;
			if (options.placeholder)
				options.options.VALUE = options.placeholder;
		}
		
		//Input type handling
		var new_component = new ve[ve.component_dictionary[options.type]](options);
		if (options.placeholder)
			if (new_component.setInput)
				try {
					new_component.setInput(options.placeholder);
				} catch (e) { console.error(e); }
		
		return new_component;
	}
	
	/**
	 * Sets the current placeholder value and updates the input value.
	 * - `arg0_options`: {@link Object}
	 *   - `.element`: {@link HTMLElement} - The DOM element containing the input and label.
	 *   - `.placeholder`: {@link Object|string} - The placeholder value to use, as computed against `.value_equation`.
	 *   - `.value`: {@link any} - Value object.
 *     - `.value_equation`: {@link string} - An equation string to compute the value, where the value is represented as `VALUE`.
	 *
	 * @returns {*}
	 */
	static setInput (arg0_options) {
		//Convert from parameters
		var options = (arg0_options) ? arg0_options : {};
		
		if (options.placeholder == undefined) return undefined; //Guard clause if options.placeholder doesn't exist
		
		//Declare local instance variables
		var placeholder_obj = JSON.parse(JSON.stringify(options.placeholder));
		
		//Parse placeholder_obj
		if (typeof placeholder_obj == "object") {
			var all_placeholder_keys = Object.keys(options.placeholder);
			
			for (var i = 0; i < all_placeholder_keys.length; i++) {
				var local_placeholder = placeholder_obj[all_placeholder_keys[i]];
				var local_placeholder_string = JSON.parse(JSON.stringify(local_placeholder));
				
				if (local_placeholder != undefined)
					placeholder_obj[all_placeholder_keys[i]] = (options.value_equation) ?
						parseVariableString(options.value_equation, { VALUE: parseVariableString(local_placeholder) }) :
						parseVariableString(local_placeholder, { ignore_errors: true });
			}
			
			if (all_placeholder_keys.length == 1 && placeholder_obj.VALUE != undefined)
				placeholder_obj = placeholder_obj.VALUE;
		}
		
		//Modify name_label_el
		var name_data_el = options.element.querySelector(`data#name-label`);
		var name_label_el = options.element.querySelector(`span#name-label`);
		
		if (name_data_el && name_label_el)
			name_label_el.innerHTML = parseLocalisation(name_data_el.innerHTML, {
				is_html: true,
				scopes: { VALUE: placeholder_obj }
			});
		
		options.element.instance.setInput(placeholder_obj);
		
		//Return statement
		return placeholder_obj;
	}
};