/**
 * ##### Constructor:
 * - `arg0_value`: {@link Array}<{@link ve.Component}>
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
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-horizontal-list");
			if (options.attributes)
				Object.iterate(options.attributes, (local_key, local_value) => {
					this.element.setAttribute(local_key, local_value.toString());
				});
			this.element.instance = this;
		this.element.style.alignItems = "center";
			this.element.style.display = "flex";
			
			this.components_el = document.createElement("div");
				this.components_el.id = "component-body";
				this.element.appendChild(this.components_el);
			this.add_item_button = new ve.Button(() => {
				this.addItem();
			}, { name: "<icon>add</icon>", tooltip: "Add Item" });
			this.add_item_button.bind(this.element);
		this.options = options;
		this.shift_positions = 1;
		this.value = Array.toArray(value);
		
		this.class_name = structuredClone(this.value[0].class_name);
		this.placeholder = structuredClone(this.value[0].v);
		this.overlay_window = undefined;
		
		//Set this.v to be the inputted ve.Component[]
		this.v = value;
	}
	
	get v () {
		//Return statement
		return this.components;
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
		
		this.draw();
	} 
	
	addItem () {
		//Push item to end of stack
		this.value.push(global[`ve${this.class_name}`](this.placeholder));
		this.draw();
	}
	
	deleteItem (arg0_index) {
		//Convert from parameters
		let index = (arg0_index) ? arg0_index : this.value.length - 1;
		if (this.value.length === 0) return; //Internal guard clause if there are already no elements in the array
		
		//Delete item at index
		this.value.splice(index, 1);
		this.draw();
	}
	
	draw () {
		//Draw .components_el from this.value
		this.components_el.innerHTML = "";
		
		//Iterate over all components in this.value
		for (let i = 0; i < this.value.length; i++) {
			this.value[i].bind(this.components_el);
			this.value[i].element.style.display = "inline";
		}
		
		//Iterate over all_component_els and apply .onclick this.overlay_interface
		let all_component_els = this.components_el.querySelectorAll(`[component]`);
		
		for (let i = 0; i < all_component_els.length; i++) {
			let overlay_interface = new ve.Interface({
				shift_bar: new ve.RawInterface({
					shift_left_button: new ve.Button(() => {
						let shift_positions = overlay_interface.shift_bar.shift_positions.v;
						
						let new_index = Math.max(i - shift_positions, 0);
						
						this.value = Array.moveElement(this.value, i, new_index);
						this.draw();
						i = new_index;
					}, {
						name: "<icon>chevron_left</icon>",
						tooltip: "Shift Left"
					}),
					shift_positions: new ve.Number(this.shift_positions, {
						min: 1,
						name: "Shift",
						onuserchange: (v) => this.shift_positions = v,
						style: {
							marginLeft: `calc(var(--padding)*0.5)`,
							marginRight: `calc(var(--padding)*0.5)`,
							whiteSpace: "nowrap",
							"input": {
								textAlign: "center"
							}
						}
					}),
					shift_right_button: new ve.Button(() => {
						let shift_positions = overlay_interface.shift_bar.shift_positions.v;
						
						let new_index = Math.min(i + shift_positions, this.value.length - 1);
						
						this.value = Array.moveElement(this.value, i, new_index);
						this.draw();
						i = new_index;
					}, {
						name: "<icon>chevron_right</icon>",
						tooltip: `Shift Right`
					})
				}, { style: { alignItems: "center", display: "flex", justifyContent: "center" } }),
				actions_bar: new ve.RawInterface({
					insert_before_button: new ve.Button(() => {
						this.value.splice(i, 0, global[`ve${this.class_name}`](this.placeholder));
						this.draw();
					}, { name: "<icon>first_page</icon>", tooltip: "Insert Item Before" }),
					insert_after_button: new ve.Button(() => {
						this.value.splice(i + 1, 0, global[`ve${this.class_name}`](this.placeholder));
						this.draw();
					}, { name: "<icon>last_page</icon>", tooltip: "Insert Item After" }),
					delete_button: new ve.Button(() => {
						this.deleteItem(i);
						if (this.overlay_window) this.overlay_window.close();
					}, { name: "<icon>delete</icon>", tooltip: "Delete Item" }),
				}, { style: { alignItems: "center", display: "flex", justifyContent: "center" } })
			}, {
				is_folder: false
			});
			
			all_component_els[i].addEventListener("contextmenu", () => {
				if (this.overlay_window) this.overlay_window.close();
				this.overlay_window = new ve.Window(overlay_interface, {
					can_rename: false,
					name: "Edit Item",
					y: HTML.mouse_y + all_component_els[i].offsetHeight
				});
			});
		}
	}
}