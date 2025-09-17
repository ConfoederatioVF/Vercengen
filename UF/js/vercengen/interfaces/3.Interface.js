if (!global.ve) global.ve = {};

/**
 * Represents a Vercengen Interface. Contains a number of components.
 *
 * Interfaces are a sort of form/UI that stores local states. It can be recursively nested via the use of ComponentInterface as a sub-component, which utilises the same options.
 *
 * ##### DOM:
 * - `.instance`: this:{@link ve.Interface}
 *
 * ##### Instance:
 * - `.options`: <span color = "lime">{@link ve.Interface.options}</span>
 * <br>
 * - `.element`: {@link HTMLElement}
 * <br>
 * - `.components`: {@link Object}<{@link ve.Component}>
 * - `.table_rows`: {@link Object}<{@link Array}<{@link Array}<{@link ve.Component}>>> - Shares all ve.Component instances in a 2D X/Y array.
 *
 * @type {ve.Interface}
 */
ve.Interface = class {
	/**
	 * - `.anchor`: {@link HTMLElement|string} - The element the present Interface should be attached to.
	 * - `.class`: {@link string} - The CSS class to apply to the present Interface.
	 * - `.id=generateRandomNumber(`<span color = "white">{@link ve.interfaces}</span>`)`
	 * <br>
	 * - `.can_close=false` {@link boolean}
	 * - `.do_not_append=false` {@link boolean}
	 * - `.is_resizable=false` {@link boolean}
	 * - `.is_window=false` {@link boolean}
	 * - `.name=""` {@link string}
	 * - `.maximum_height` {@link string} - The height after which a scrollbar should appear in CSS units. `calc` string.
	 * - `.maximum_width` {@link string} - The maximum width in CSS units. `calc` string.
	 *
	 * - `<component_key>`: <span color = "lime">{@link ve.Component.options}</span>
	 *
	 * @typedef {Object} ve.Interface.options
	 *
	 * @property {function(HTMLElement.prototype.onclick)} [options.close_function]
	 */
	constructor (arg0_options) {
		//Convert from parameters
		var options = (arg0_options) ? arg0_options : {};
		
		//Initialise options
		if (!options.class) options.class = "";
		
		//Declare local instance variable	s
		var all_options = Object.keys(options);
		var default_keys = ["anchor", "class", "id", "maximum_height", "maximum_width"];
		this.components = {};
		this.element = document.createElement("div");
		var query_selector_el;
		var table_columns = 0;
		this.table_rows = 0;
		
		//Set interface object in ve.interfaces
		this.interface_id = (options.id) ? options.id : generateRandomID(ve.interfaces);
		ve.interfaces[this.interface_id] = this;
		
		//Format CSS strings
		var height_string = (options.maximum_height) ? `height: ${options.maximum_height}; overflow-y: auto;` : "";
		var width_string = (options.maximum_width) ? `width: ${options.maximum_width}; overflow-x: hidden;` : "";
		
		var parent_style = `${height_string}${width_string}`;
		
		//Format interface_el
		if (options.id) this.element.id = options.id;
		this.element.setAttribute("class", `${(options.class) ? options.class + " " : ""}${global.ve.default_class}`);
		if (parent_style.length > 0) this.element.setAttribute("style", `${parent_style}`);
		
		//Add close button
		var can_close = (options.can_close);
		if (options.class)
			if (options.class.includes("unique"))
				can_close = true;
		
		if (can_close) {
			var close_button_el = document.createElement("img");
			
			close_button_el.id = "close-button";
			close_button_el.src = "./UF/gfx/close_icon_dark.png";
			close_button_el.className = "uf-close-button";
			close_button_el.draggable = false;
			close_button_el.onclick = (e) => {
				if (options.close_function)
					options.close_function(e);
				this.close();
			};
			
			this.element.appendChild(close_button_el);
		}
		
		//Fetch table_columns; table_rows
		for (var i = 0; i < all_options.length; i++) {
			var local_option = options[all_options[i]];
			
			//This is an input field; process .x, .y
			if (typeof local_option == "object") {
				if (local_option.x)
					table_columns = Math.max(table_columns, local_option.x);
				if (local_option.y) {
					this.table_rows = Math.max(this.table_rows, local_option.y);
				} else {
					this.table_rows++;
				}
			}
		}
		
		//Iterate over all_options; format them
		var table_el = document.createElement("table");
		
		var current_row = 0;
		this.table_rows = [];
		
		//1. Initialise table_rows
		for (var i = 0; i < all_options.length; i++) {
			var local_option = options[all_options[i]];
			
			if (typeof local_option == "object") {
				if (local_option.y != undefined) {
					current_row = local_option.y;
				} else {
					current_row++;
					local_option.y = current_row;
				}
				
				//Initialise table_rows[current_row]:
				this.table_rows[current_row] = [];
			}
		}
		
		//2. Populate table_rows
		for (var i = 0; i < all_options.length; i++) {
			var local_option = options[all_options[i]];
			
			if (typeof local_option == "object" && local_option.type != undefined) {
				var local_el_html = [];
				var local_row = this.table_rows[local_option.y];
				var local_x = (local_option.x != undefined) ?
					local_option.x : local_row.length;
				
				//.id is not settable since it is essentially boilerplate given that .id is contained in the key anyway
				local_option.id = all_options[i];
				local_option.parent = this;
				if (typeof local_option.type != "string") local_option.type = "text";
				local_option.x = local_x;
				
				var local_component = new ve.Component(this, local_option);
				this.components[(local_option.id) ? local_option.id : all_options[i]] = local_component;
				
				//Set local_row[local_x]
				local_row[local_x] = local_component.component;
			}
		}
		
		//3. Render and append table rows to table_el
		for (var i = 0; i < this.table_rows.length; i++) {
			var row_el = document.createElement("tr");
			
			if (this.table_rows[i])
				for (var x = 0; x < this.table_rows[i].length; x++)
					if (this.table_rows[i][x])
						row_el.appendChild(this.table_rows[i][x]);
			
			if (row_el.innerHTML.length == 0) continue; //Internal guard clause if row is empty
			
			table_el.appendChild(row_el);
		}
		
		//Append table to interface
		this.element.appendChild(table_el);
		this.element.instance = this;
		options.parent = this;
		
		//Window handler
		{
			if (options.is_window) {
				var is_resizable = (options.is_resizable != false) ? true : false;
				
				//Invoke elementDragHandler()
				elementDragHandler(this.element, { is_resizable: is_resizable });
			}
		}
		
		if (!options.return_html) {
			if (options.anchor) {
				query_selector_el = (isElement(options.anchor)) ?
					options.anchor : document.querySelector(options.anchor);
				
				if (!options.do_not_append) {
					query_selector_el.appendChild(this.element);
				} else {
					query_selector_el.replaceChildren(this.element);
				}
			}
		} else {
			return this.element.innerHTML;
		}
	}
	
	/**
	 * Closes the current interface and removes it from {@link ve.interfaces}.
	 */
	close () {
		delete ve.interfaces[this.interface_id];
		this.element.parentElement.remove();
	}
	
	/**
	 * Returns the {@link ve.Interface} object of a specific interface ID, assuming `.id` is specified.
	 * @param {string} arg0_interface_id
	 *
	 * @returns {ve.Interface}
	 */
	static getInterface (arg0_interface_id) {
		//Convert from parameters
		var interface_id = arg0_interface_id;
		
		//Return statement
		return ve.interfaces[interface_id];
	}
	
	/**
	 * Returns the current Interface state according to inputs. State functions return a merged flattened-nested object.
	 *
	 * @returns {{"<flattened.key>": *, "<key>": *}}
	 */
	getState () {
		//Return statement
		return ve.getElementState(this.element);
	}
	
	/**
	 * Returns the current Interface state of the a specific interface ID; returns an empty object if interface could not be reached.
	 * @param {string} arg0_interface_id
	 *
	 * @returns {{"<flattened.key>": *, "<key>": *}|{}}
	 */
	static getState (arg0_interface_id) {
		//Convert from parameters
		var interface_id = arg0_interface_id;
		
		//Declare local instance variables
		var interface_obj = ve.Interface.getInterface(interface_id);
		
		//Return statement
		if (interface_obj)
			return interface_obj.getState();
		return {};
	}
};