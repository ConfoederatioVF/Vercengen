/**
 * Refer to <span color = "yellow">{@link ve.Component}</span> for methods or fields inherited from this Component's parent such as `.options.attributes` or `.element`.
 *
 * A recursive editor for JavaScript Objects, Arrays, and primitives.
 * Allows adding and editing specific types: String, Number, Boolean, Object, and Array.
 * - Functional binding: <span color=00ffff>veObjectEditor</span>().
 *
 * ##### Constructor:
 * - `arg0_value`: {@link Object}|{@link Array} - The object to edit.
 * - `arg1_options`: {@link Object}
 *   - `.collapsed_depth=1`: {@link number} - The depth at which folders start collapsing automatically.
 *   - `.show_icons=true`: {@link boolean} - Whether to show type icons.
 *
 * ##### Instance:
 * - `.hierarchy`: {@link ve.Hierarchy} - The internal hierarchy component.
 * - `.v`: {@link Object}|{@link Array}
 *
 * ##### Methods:
 * - <span color=00ffff>{@link ve.ObjectEditor.refresh|refresh}</span>()
 *
 * @augments ve.Component
 * @memberof ve.Component
 * @type {ve.ObjectEditor}
 */
ve.ObjectEditor = class extends ve.Component { //[WIP] - Refactor at a later date.
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		let options = (arg1_options) ? arg1_options : {};
		super(options);
		
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		options.collapsed_depth = (options.collapsed_depth !== undefined) ? options.collapsed_depth : 1;
		options.show_icons = (options.show_icons !== undefined) ? options.show_icons : true;
		
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-object-editor");
			HTML.setAttributesObject(this.element, options.attributes);
			this.element.instance = this;
		
		this.value = value;
		this.options = options;
		
		this.refresh();
	}
	
	/**
	 * Returns the present object value.
	 * @alias v
	 * @memberof ve.Component.ve.ObjectEditor
	 * @type {Object|Array}
	 */
	get v () {
		return this.value;
	}
	
	/**
	 * Sets the present object value and refreshes the tree.
	 * @alias v
	 * @memberof ve.Component.ve.ObjectEditor
	 * @param arg0_value {Object|Array}
	 */
	set v (arg0_value) {
		this.value = arg0_value;
		this.refresh();
		this.fireFromBinding();
	}
	
	/**
	 * Opens a modal to add a new property with a specific type.
	 * @private
	 * @param {Object|Array} target_obj - The container to add to.
	 */
	_openAddModal(target_obj) {
		let is_array = Array.isArray(target_obj);
		
		// 1. Construct the components object dynamically to avoid undefined keys
		let modal_components = {};
		
		// Info Text
		modal_components.info = new ve.HTML((is_array) ? "Select the type of item to push to the array." : "Define the key name and value type.");
		
		// Key Input (Only add this key if it is NOT an array)
		if (!is_array) {
			modal_components.key_name = new ve.Text("", {
				placeholder: "Property Name",
				style: { marginBottom: "var(--cell-padding)" }
			});
		}
		
		// Type Select
		modal_components.type_select = new ve.Select({
			string: { name: "String", selected: true },
			number: { name: "Number" },
			boolean: { name: "Boolean" },
			object: { name: "Object" },
			array: { name: "Array" }
		}, {
			style: { width: "100%", marginBottom: "var(--cell-padding)" }
		});
		
		// Confirm Button
		modal_components.confirm_btn = new ve.Button(() => {
			// Retrieve values from the modal components
			let selected_type = win.components_obj.type_select.v;
			let new_key = undefined;
			
			if (is_array) {
				new_key = target_obj.length;
			} else {
				// Safely access key_name since we know it exists in this branch
				new_key = win.components_obj.key_name.v;
			}
			
			// Validation
			if (!is_array && !new_key) {
				new ve.Toast("Please enter a property name.");
				return;
			}
			if (!is_array && target_obj.hasOwnProperty(new_key)) {
				new ve.Toast(`Property "${new_key}" already exists.`);
				return;
			}
			
			// Determine Default Value based on type
			let new_value = null;
			switch (selected_type) {
				case "string": new_value = ""; break;
				case "number": new_value = 0; break;
				case "boolean": new_value = false; break;
				case "object": new_value = {}; break;
				case "array": new_value = []; break;
			}
			
			// Assign value
			if (is_array) {
				target_obj.push(new_value);
			} else {
				target_obj[new_key] = new_value;
			}
			
			// Cleanup and Refresh
			win.remove(); // Assuming remove() closes the window based on standard lifecycle
			this.refresh();
			this.fireToBinding();
			
		}, { name: "Add Item", style: { width: "100%" } });
		
		// 2. Create the Window
		let win = new ve.Window(modal_components, {
			name: (is_array) ? "Add to Array" : "Add Property",
			width: "300px",
			height: "auto",
			can_minimize: false
		});
	}
	
	/**
	 * Internal helper to determine simplified type string.
	 * @private
	 */
	_getType(value) {
		if (Array.isArray(value)) return "array";
		if (value === null) return "null";
		return typeof value;
	}
	
	/**
	 * Internal recursive method to generate hierarchy datatypes.
	 * @private
	 */
	_generateRecursive (current_data, current_key, depth, parent_object) {
		let type = this._getType(current_data);
		let is_group = (type === "object" || type === "array");
		let components_obj = {};
		
		// 1. Icon Generation
		if (this.options.show_icons) {
			let icon_name = "help_outline";
			switch(type) {
				case "object": icon_name = "data_object"; break;
				case "array": icon_name = "data_array"; break;
				case "string": icon_name = "short_text"; break;
				case "number": icon_name = "123"; break; // or 'pin'
				case "boolean": icon_name = "toggle_on"; break;
			}
			
			components_obj.icon = new ve.HTML(`<icon>${icon_name}</icon>`, {
				style: { marginRight: "0.5rem", opacity: 0.7, display: "flex", alignItems: "center" },
				tooltip: type
			});
		}
		
		// 2. Inputs for Primitives
		let common_style = { width: "100%", minWidth: "120px" };
		
		if (!is_group) {
			if (type === "string") {
				components_obj.input = new ve.Text(current_data, {
					onuserchange: (v) => { parent_object[current_key] = v; this.fireToBinding(); },
					style: common_style
				});
			} else if (type === "number") {
				components_obj.input = new ve.Number(current_data, {
					onuserchange: (v) => { parent_object[current_key] = v; this.fireToBinding(); },
					style: common_style
				});
			} else if (type === "boolean") {
				components_obj.input = new ve.Toggle(current_data, {
					onuserchange: (v) => { parent_object[current_key] = v; this.fireToBinding(); },
					on_name: "True",
					off_name: "False"
				});
			} else {
				// Null or Unknown
				components_obj.input = new ve.HTML(`<span style="opacity:0.5">${String(current_data)}</span>`);
			}
		} else {
			// Group Controls: Add Button (Opens Modal)
			components_obj.add_child_btn = new ve.Button((e) => {
				this._openAddModal(current_data);
			}, {
				name: "<icon>add</icon>",
				tooltip: "Add Item...",
				style: { padding: "2px 6px" }
			});
		}
		
		// 3. Delete Button
		if (depth > 0) {
			components_obj.delete_btn = new ve.Button((e) => {
				veConfirm(`Are you sure you want to delete "${current_key}"?`, {
					special_function: () => {
						if (Array.isArray(parent_object)) {
							// Arrays are objects, but use splice for cleaner removal
							parent_object.splice(current_key, 1);
						} else {
							delete parent_object[current_key];
						}
						this.refresh();
						this.fireToBinding();
					}
				});
			}, {
				name: "<icon>close</icon>",
				tooltip: "Delete",
				style: { padding: "2px 6px", marginLeft: "0.25rem", color: "var(--color-error)" }
			});
		}
		
		// 4. Generate Children (if group)
		if (is_group) {
			// Arrays are objects, Object.keys works for both
			Object.keys(current_data).forEach((key) => {
				let safe_key = key;
				if (Array.isArray(current_data)) safe_key = parseInt(key);
				
				// Add to components_obj so ve.HierarchyDatatype nests them
				components_obj[`child_${key}`] = this._generateRecursive(current_data[key], safe_key, depth + 1, current_data);
			});
		}
		
		// 5. Create HierarchyDatatype
		return new ve.HierarchyDatatype(components_obj, {
			name: `${current_key}`,
			type: is_group ? "group" : "item",
			is_collapsed: (depth >= this.options.collapsed_depth),
			
			style: {
				".nst-content": {
					display: "flex",
					alignItems: "center",
					paddingRight: "0.5rem"
				},
				// Flex push inputs to right
				"[component='ve-raw-interface']": { marginLeft: "auto" },
				"[component='ve-text'], [component='ve-number'], [component='ve-toggle'], [component='ve-html']": { marginLeft: "auto" }
			}
		});
	}
	
	/**
	 * Refreshes the hierarchy display based on the current value.
	 * - Method of: {@link ve.ObjectEditor}
	 */
	refresh () {
		this.element.innerHTML = "";
		
		// 1. Actions Bar (Add to Root)
		let actions_bar = new ve.HierarchyDatatype({
			title: new ve.HTML("<b>Object Editor</b>", { style: { marginRight: "auto" } }),
			
			// This button allows adding to the top-level object/array
			add_root_btn: new ve.Button(() => {
				if (this.value === null) this.value = {};
				this._openAddModal(this.value);
			}, {
				name: "<icon>playlist_add</icon>",
				tooltip: "Add Property to Root"
			})
		}, {
			disabled: true,
			attributes: { class: "actions-bar" },
			style: {
				".nst-content": {
					backgroundColor: "var(--color-bg-2)",
					borderBottom: "1px solid var(--color-border)",
					padding: "0.25rem 0.5rem"
				}
			}
		});
		
		// 2. Generate Root Items
		let hierarchy_obj = { actions_bar: actions_bar };
		
		if (this.value && typeof this.value === "object") {
			Object.keys(this.value).forEach((key) => {
				let safe_key = key;
				if (Array.isArray(this.value)) safe_key = parseInt(key);
				
				hierarchy_obj[`root_${key}`] = this._generateRecursive(this.value[key], safe_key, 0, this.value);
			});
		} else if (this.value !== undefined) {
			// Edge case: Root is primitive
			hierarchy_obj["root_primitive"] = this._generateRecursive(this.value, "value", 0, { value: this.value });
		}
		
		// 3. Mount Hierarchy
		this.hierarchy = new ve.Hierarchy(hierarchy_obj, {
			disable_searchbar: false,
			searchbar_style: { marginBottom: "0" }
		});
		
		// Style adjustments
		this.hierarchy.element.style.height = "100%";
		this.hierarchy.element.style.overflowY = "auto";
		
		// Forward owner for reflection
		if (this.owner) this.hierarchy.setOwner(this.owner);
		
		this.element.appendChild(this.hierarchy.element);
	}
};

//Functional binding

/**
 * @returns {ve.ObjectEditor}
 */
veObjectEditor = function () {
	return new ve.ObjectEditor(...arguments);
};