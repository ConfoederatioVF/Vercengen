ve.Interface = class veInterface extends ve.Component {
	static demo_value = {
		submenu_html: new ve.HTML("This is hidden HTML.")
	};
	
	constructor (arg0_components_obj, arg1_options) {
		//Convert from parameters
		let components_obj = (arg0_components_obj) ? arg0_components_obj : {};
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Initialise options
		if (options.is_folder !== false) options.is_folder = true;
		
		//Declare local instance variables
		let attributes = {
			open: options.open,
			...options.attributes
		};
		this.components_obj = components_obj;
		this.dimensions = [0, 0]; //Populate this.dimensions to [width, height];
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-interface");
			this.element.instance = this;
			HTML.applyCSSStyle(this.element, options.style);
		
		let html_string = [];
		if (options.is_folder) {
			html_string.push(`<details class = "ve interface-folder"${HTML.objectToAttributes(attributes)}>`);
				html_string.push(`<summary id = "name"></summary>`);
		}
				html_string.push(`<table></table>`);
			html_string.push(`</details>`);
		
		this.element.innerHTML = html_string.join("");
		
		//KEEP AT BOTTOM!
		this.name = options.name;
		this.reserved_keys = Object.keys(this).concat(["reserved_keys", "v"]);
		this.v = components_obj;
	}
	
	get name () {
		//Return statement
		return this.element.querySelector(`summary#name`).innerHTML;
	}
	
	set name (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
		
		//Set name
		this.element.querySelector(`summary#name`).innerHTML = (value) ? value : "Folder";
	}
	
	get v () {
		//Return statement
		return this.components_obj;
	}
	
	set v (arg0_components_obj) { //[WIP] - Work on destructuring bindings
		//Convert from parameters
		let components_obj = arg0_components_obj;
		
		//Set this.components_obj; invoke this.redraw()
		//1. Reset old destructured bindings for components_obj by deleting their addresses
		Object.iterate(components_obj, (local_key, local_value) => {
			if (!this.reserved_keys.includes(local_key)) delete this[local_key];
		});
		this.components_obj = components_obj;
		//2. Set new destructured bindings for components_obj by deleting their addresses
		Object.iterate(components_obj, (local_key, local_value) => {
			if (!this.reserved_keys.includes(local_key)) {
				if (local_value.name === undefined || local_value.name === "") 
					local_value.name = local_key;
				this[local_key] = local_value;
			} else {
				console.warn(`ve.Interface: ${local_key} is a reserved key. It can therefore not be set to:`, local_value);
			}
		})
		this.redraw();
		if (this.options.onchange) this.options.onchange(this.value);
	}
	
	/**
	 * Iterates over all components and assigns their coordinates.
	 * @param {Object} arg0_components_obj
	 */
	static assignComponentCoordinates (arg0_components_obj) {
		//Convert from parameters
		let components_obj = arg0_components_obj;
		
		//Declare local instance variables
		let defined_dimensions = ve.Interface.getDefinedComponentDimensions(components_obj);
		
		//2. Append undefined coordinates vertically to their relevant X or Y axis, depending on which is defined. Vertical stacking with X = 0 defined by default
		Object.iterate(components_obj, (local_key, local_value) => {
			try {
				if (local_value.is_vercengen_component) {
					let has_x = (typeof local_value.x === "number");
					let has_y = (typeof local_value.y === "number");
					
					if (has_x && has_y) return;
					
					if (!has_x && has_y) {
						defined_dimensions[0]++;
						local_value.x = defined_dimensions[0];
					} else if (has_x && !has_y) {
						defined_dimensions[1]++;
						local_value.y = defined_dimensions[1];
					} else {
						local_value.x = 0;
						
						defined_dimensions[1]++;
						local_value.y = defined_dimensions[1];
					}
				}
			} catch (e) { console.error(e); }
		});
		
		//Return statement
		return components_obj;
	}
	
	static getDefinedComponentDimensions (arg0_components_obj) {
		//Convert from parameters
		let components_obj = arg0_components_obj;
		
		//Declare local instance variables
		let defined_dimensions = [0, 0];
		
		//Fetch defined dimensions [width, height] by iterating over components_obj
		Object.iterate(components_obj, (local_key, local_value) => {
			try {
				if (local_value.is_vercengen_component)
					if (typeof local_value.x === "number" && typeof local_value.y === "number") {
						defined_dimensions[0] = Math.max(defined_dimensions[0], local_value.x);
						defined_dimensions[1] = Math.max(defined_dimensions[1], local_value.y);
					}
			} catch (e) { console.error(e); }
		});
		
		//Return statement
		return defined_dimensions;
	}
	
	addComponent (arg0_component_id, arg1_component_obj) {
		//Convert from parameters
		let component_id = arg0_component_id;
		let component_obj = arg1_component_obj;
		
		//Assign x, y coordinates to component_obj
		this.components_obj[component_id] = component_obj;
		this.redraw();
	}
	
	/**
	 * Redraws the entire UI for {@link ve.Interface}, including refreshing individual table cells.
	 */
	redraw () {
		this.components_obj = ve.Interface.assignComponentCoordinates(this.components_obj);
		this.dimensions = ve.Interface.getDefinedComponentDimensions(this.components_obj);
		this.resize(this.dimensions[0] + 1, this.dimensions[1] + 1);
		
		//Populate x-y with individual Vercengen components in mutated components_obj
		this.refresh();
	}
	
	refresh () {
		Object.iterate(this.components_obj, (local_key, local_value) => {
			try {
				if (local_value.is_vercengen_component) {
					let target_cell_el = this.element.querySelector(`table td[id="${local_value.x}-${local_value.y}"]`);
					
					//Parse height, width
					if (local_value.height !== undefined) {
						target_cell_el.setAttribute("rowspan", local_value.height);
					} else {
						target_cell_el.removeAttribute("rowspan");
					}
					if (local_value.width !== undefined) {
						target_cell_el.setAttribute("colspan", local_value.width);
					} else {
						target_cell_el.removeAttribute("colspan");
					}
					
					//Set inner cell contents
					target_cell_el.innerHTML = "";
					target_cell_el.appendChild(local_value.element);
				}
			} catch (e) { console.error(e); }
		});
	}
	
	remove () {
		this.element.remove();
	}
	
	removeComponent (arg0_component_obj) {
		//Convert from parameters
		let component_obj = arg0_component_obj;
		
		//Remove component_obj, refresh this ve.Interface
		component_obj.remove();
		this.refresh();
	}
	
	resize (arg0_width, arg1_height) {
		//Convert from parameters
		let width = parseInt(arg0_width);
		let height = parseInt(arg1_height);
		
		//Declare local instance variables
		let table_el = this.element.querySelector("table");
		
		//Adjust height
		{
			//1. Add missing rows
			let current_height = table_el.rows.length;
			
			//Iterate over height to insert missing rows
			for (let i = current_height; i < height; i++) {
				let local_row = table_el.insertRow();
				
				//Iterate over width to populate the given row
				for (let x = 0; x < width; x++)
					local_row.insertCell();
			}
			
			//2. Remove extra rows
			for (let i = table_el.rows.length - 1; i >= height; i--)
				table_el.deleteRow(i);
		}
		
		//Adjust width
		{
			//1. Add missing columns
			let current_height = Math.min(height, table_el.rows.length); //Bound current_height so that we never go out of bounds
			
			for (let i = 0; i < current_height; i++) {
				let local_row = table_el.rows[i];
				
				let current_width = local_row.cells.length;
				
				for (let x = current_width; x < width; x++)
					local_row.insertCell();
				
				//2. Remove missing columns
				for (let x = current_width - 1; x >= width; x--)
					table_el.deleteCell(x);
			}
		}
		
		//Assign x, y IDs to each cell
		for (let i = 0; i < table_el.rows.length; i++)
			for (let x = 0; x < table_el.rows[i].cells.length; x++)
				table_el.rows[i].cells[x].id = `${x}-${i}`;
	}
};