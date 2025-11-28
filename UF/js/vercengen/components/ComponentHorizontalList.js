/**
 * ##### Constructor:
 * - `arg0_value`: {@link Object}
 *   - `.component_type`: {@link ve.Component}
 *   - `.type`: {@link string} - Either 'number'/'string'.
 *   - `.value`: {@link any} - The initial value of the first element in the list, default placeholder value for later elements.
 * - `arg1_options`: {@link Object}
 * 
 * @type {ve.HorizontalList}
 */
ve.HorizontalList = class extends ve.Component {
	static instances = [];
	
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = arg0_value;
		let options = (arg1_options) ? arg1_options : {};
			super(options);
		
		//Declare local instance variables
		this.element = value;
			this.element.setAttribute("component", "ve-horizontal-list");
			if (options.attributes)
				Object.iterate(options.attributes, (local_key, local_value) => {
					this.element.setAttribute(local_key, local_value.toString());
				});
			this.element.instance = this;
			this.components_el = document.createElement("div");
				this.components_el.id = "component-body";
				this.element.appendChild(this.components_el);
		this.options = options;
		this.value = (value) ? value : [];
		
		//Format this.create_item_button; this.overlay_interface
		this.overlay_interface = new ve.Interface({
			shift_bar: new ve.RawInterface({
				shift_left_button: new ve.Button(() => {}, {
					name: "<icon>chevron_left</icon>",
					tooltip: "Shift Left"
				}),
				shift_positions: new ve.Number(1, {
					min: 1,
					name: "Shift",
					style: {
						marginLeft: `calc(var(--padding)*0.5)`,
						marginRight: `calc(var(--padding)*0.5)`,
						whiteSpace: "nowrap",
						"input": {
							textAlign: "center"
						}
					}
				}),
				shift_right_button: new ve.Button(() => {}, {
					name: "<icon>chevron_right</icon>",
					tooltip: `Shift Right`
				})
			}, { style: { alignItems: "center", display: "flex", justifyContent: "center" } }),
			actions_bar: new ve.RawInterface({
				insert_before_button: new ve.Button(() => {
					
				}, { name: "<icon>first_page</icon>", tooltip: "Insert Item Before" }),
				insert_after_button: new ve.Button(() => {
					
				}, { name: "<icon>last_page</icon>", tooltip: "Insert Item After" }),
				delete_button: new ve.Button(() => {
					
				}, { name: "<icon>delete</icon>", tooltip: "Delete Item" }),
			}, { style: { alignItems: "center", display: "flex", justifyContent: "center" } })
		}, {
			is_folder: false
		});
		this.overlay_window = undefined;
		
		//Set this.v to be the inputted HTMLElement
		this.v = value;
	}
	
	get v () {
		//Return statement
		return this.components;
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
	}
	
	drawListDialogue () {
		//Iterate over all_input_els and apply .onclick this.overlay_interface
		/*let all_input_els = this.element.querySelectorAll(`input`);
		
		for (let i = 0; i < all_input_els.length; i++)
			all_input_els[i].addEventListener("click", () => {
				if (this.overlay_window) this.overlay_window.close();
				this.overlay_window = new ve.Window(this.overlay_interface, {
					can_rename: false,
					name: "Edit Item",
					y: HTML.mouse_y + all_input_els[i].offsetHeight
				});
			});*/
	}
}