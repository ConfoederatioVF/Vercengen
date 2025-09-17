//Initialise functions
global.ve = {
	//Set defines
	
	/**
	 * - `"basic_colour"`: {@link ve.ComponentBasicColour}
	 * - `"basic_file"`: {@link ve.ComponentBasicFile}
	 * - `"biuf"`: {@link ve.ComponentBIUF}
	 * - `"button"`: {@link ve.ComponentButton}
	 * - `"checkbox"`: {@link ve.ComponentCheckbox}
	 * - `"colour"`: {@link ve.ComponentColour}
	 * - `"datalist"`: {@link ve.ComponentDatalist}
	 * - `"date"`: {@link ve.ComponentDate}
	 * - `"date_length"`: {@link ve.ComponentDateLength}
	 * - `"email"`: {@link ve.ComponentEmail}
	 * - `"html"`: {@link ve.ComponentHTML}
	 * - `"interface"`: {@link ve.ComponentInterface} - Recursive component for {@link ve.Interface}.
	 * - `"number"`: {@link ve.ComponentNumber}
	 * - `"password"`: {@link ve.ComponentPassword}
	 * - `"radio"`: {@link ve.ComponentRadio}
	 * - `"range"`: {@link ve.ComponentRange}
	 * - `"reset"`: {@link ve.ComponentReset}
	 * - `"search_select"`: {@link ve.ComponentSearchSelect}
	 * - `"select"`: {@link ve.ComponentSelect}
	 * - `"sortable_list"`: {@link ve.ComponentSortableList}
	 * - `"submit"`: {@link ve.ComponentSubmit}
	 * - `"telephone"`/`"tel"`: {@link ve.ComponentTelephone}
	 * - `"text"`: {@link ve.ComponentText}
	 * - `"time"`: {@link ve.ComponentTime}
	 * - `"url"`: {@link ve.ComponentURL}
	 * - `"wysiwyg"`/`"rich_text"`: {@link ve.ComponentWYSIWYG}
	 *
	 * @typedef ve.component_dictionary
	 */
	/** Documentation: <span color = "white">{@link ve.component_dictionary}</span> */
	component_dictionary: {
		basic_colour: "ComponentBasicColour",
		basic_file: "ComponentBasicFile",
		biuf: "ComponentBIUF",
		button: "ComponentButton",
		checkbox: "ComponentCheckbox",
		colour: "ComponentColour",
		datalist: "ComponentDatalist",
		date: "ComponentDate",
		date_length: "ComponentDateLength",
		email: "ComponentEmail",
		html: "ComponentHTML",
		interface: "ComponentInterface",
		number: "ComponentNumber",
		password: "ComponentPassword",
		radio: "ComponentRadio",
		range: "ComponentRange",
		reset: "ComponentReset",
		search_select: "ComponentSearchSelect",
		select: "ComponentSelect",
		sortable_list: "ComponentSortableList",
		submit: "ComponentSubmit",
		telephone: "ComponentTelephone",
			tel: "ComponentTelephone",
		text: "ComponentText",
		time: "ComponentTime",
		url: "ComponentURL",
		wysiwyg: "ComponentWYSIWYG",
			rich_text: "ComponentWYSIWYG",
	},
	default_class: `ve context-menu`,
	interfaces: {}, //Stores all Interfaces and their Components in state
	windows: {}, //Stores all Windows in state

	//1. State functions
	/** Initialises Vercengen for the present app session. */
	initialise: function () {
		//Declare Windows overlay element
		ve.window_overlay_el = document.createElement("div");
		ve.window_overlay_el.id = "ve-overlay";
		ve.window_overlay_el.setAttribute("class", "ve-overlay");
		document.body.appendChild(ve.window_overlay_el);
	},
	updateVercengenState: function () { //[WIP] - Finish function body
		//Iterate over ve.windows; ve.interfaces; and remove those without a valid .element
	},
	
	//2. Helper functions
	/**
	 * Returns the state variable of the present Vercengen HTMLElement.
	 * @param {HTMLElement} arg0_context_menu_el - The context menu element.
	 * @param {Object} [arg1_options]
	 *  @param {boolean} [arg1_options.do_not_include_submenus=false]
	 *  @param {Function} [arg1_options.custom_file_function]
	 *  @param {Function} [arg1_options.custom_html_function]
	 */
	getElementState (arg0_context_menu_el, arg1_options) {
		//Convert from parameters
		var context_menu_el = arg0_context_menu_el;
		var options = (arg1_options) ? arg1_options : {};
		
		//Declare local instance variables
		var all_inputs = context_menu_el.querySelectorAll(`.context-menu-cell`);
		var return_obj = {};
		
		//Iterate over all_inputs and set values in return_obj by referring to the ID
		for (let i = 0; i < all_inputs.length; i++) {
			var has_output = true;
			var local_id = all_inputs[i].getAttribute("id");
			var local_output;
			
			//Fetch local_output
			if (!all_inputs[i].instance.getInput) continue; //Internal guard clause if getInput() is not bound
			local_output = all_inputs[i].instance.getInput();
			if (local_output != null && local_output != undefined) has_output = true;
			
			//Set return_obj[local_id]
			if (has_output) {
				if (!Array.isArray(local_output) && typeof local_output == "object")
					return_obj = mergeObjects(return_obj, local_output);
				return_obj[local_id] = local_output;
			}
		}
		
		//Return statement
		return return_obj;
	}
};