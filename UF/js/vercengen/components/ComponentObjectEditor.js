/**
 * Refer to <span color = "yellow">{@link ve.Component}</span> for methods or fields inherited from this Component's parent such as `.options.attributes` or `.element`.
 *
 * A recursive editor for JavaScript Objects, Arrays, and primitives.
 * Layout: [Icon] [Key] : [Value] ... [Delete]
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
ve.ObjectEditor = class extends ve.Component { //[WIP] - Refactor at a later date, move .collapsed_depth > .auto_collapse_depth, .show_icons > .do_not_display_icons, add .do_not_allow_deletion, .do_not_allow_insertion
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
	
	get v () { return this.value; }
	set v (arg0_value) {
		this.value = arg0_value;
		this.refresh();
		this.fireFromBinding();
	}
	
	// --- Data Helpers ---
	
	_moveArrayItem(arr, old_index, new_index) {
		if (new_index >= arr.length) new_index = arr.length - 1;
		if (new_index < 0) new_index = 0;
		if (old_index === new_index) return;
		const item = arr.splice(old_index, 1)[0];
		arr.splice(new_index, 0, item);
		this.refresh();
		this.fireToBinding();
	}
	
	_renameObjectKey(obj, old_key, new_key) {
		if (old_key === new_key) return;
		if (obj.hasOwnProperty(new_key)) {
			new ve.Toast(`Key "${new_key}" already exists.`);
			this.refresh();
			return;
		}
		const keys = Object.keys(obj);
		const new_obj = {};
		keys.forEach(key => {
			if (key === old_key) new_obj[new_key] = obj[old_key];
			else new_obj[key] = obj[key];
		});
		Object.keys(obj).forEach(k => delete obj[k]);
		Object.assign(obj, new_obj);
		this.refresh();
		this.fireToBinding();
	}
	
	_getType(value) {
		if (Array.isArray(value)) return "array";
		if (value === null) return "null";
		return typeof value;
	}
	
	// --- Modal ---
	
	_openAddModal(target_obj) {
		let is_array = Array.isArray(target_obj);
		let modal_components = {};
		
		modal_components.info = new ve.HTML((is_array) ? "Select the type of item to push to the array." : "Define the key name and value type.");
		
		if (!is_array) {
			modal_components.key_name = new ve.Text("", {
				placeholder: "Property Name",
				style: { marginBottom: "var(--cell-padding)" }
			});
		}
		
		modal_components.type_select = new ve.Select({
			string: { name: "String", selected: true },
			number: { name: "Number" },
			boolean: { name: "Boolean" },
			object: { name: "Object" },
			array: { name: "Array" }
		}, {
			style: { width: "100%", marginBottom: "var(--cell-padding)" }
		});
		
		modal_components.confirm_btn = new ve.Button(() => {
			let selected_type = win.components_obj.type_select.v;
			let new_key = (is_array) ? target_obj.length : win.components_obj.key_name.v;
			
			if (!is_array && !new_key) {
				new ve.Toast("Please enter a property name.");
				return;
			}
			if (!is_array && target_obj.hasOwnProperty(new_key)) {
				new ve.Toast(`Property "${new_key}" already exists.`);
				return;
			}
			
			let new_value = null;
			switch (selected_type) {
				case "string": new_value = ""; break;
				case "number": new_value = 0; break;
				case "boolean": new_value = false; break;
				case "object": new_value = {}; break;
				case "array": new_value = []; break;
			}
			
			if (is_array) target_obj.push(new_value);
			else target_obj[new_key] = new_value;
			
			win.remove();
			this.refresh();
			this.fireToBinding();
			
		}, { name: "Add Item", style: { width: "100%" } });
		
		let win = new ve.Window(modal_components, {
			name: (is_array) ? "Add to Array" : "Add Property",
			width: "300px",
			height: "auto",
			can_minimize: false
		});
	}
	
	// --- Generator ---
	
	_generateRecursive (current_data, current_key, depth, parent_object) {
		let type = this._getType(current_data);
		let is_group = (type === "object" || type === "array");
		let parent_is_array = Array.isArray(parent_object);
		
		// We use 'order' styles to enforce:
		// 0: Icon
		// 1: Key
		// 2: Separator
		// 3: Value
		// 4: Delete Button (Right aligned)
		
		let components_obj = {};
		
		// 1. Icon (Order 0)
		if (this.options.show_icons) {
			let icon_name = "help_outline";
			switch(type) {
				case "object": icon_name = "data_object"; break;
				case "array": icon_name = "data_array"; break;
				case "string": icon_name = "short_text"; break;
				case "number": icon_name = "123"; break;
				case "boolean": icon_name = "toggle_on"; break;
			}
			
			components_obj.icon = new ve.HTML(`<icon>${icon_name}</icon>`, {
				style: {
					order: 0,
					marginRight: "0.5rem",
					opacity: 0.7,
					display: "flex",
					alignItems: "center"
				},
				tooltip: type
			});
		}
		
		// 2. Key Input (Order 1)
		if (parent_is_array) {
			components_obj.key_input = new ve.Number(current_key, {
				min: 0,
				max: parent_object.length - 1,
				onuserchange: (new_index) => {
					this._moveArrayItem(parent_object, current_key, new_index);
				},
				style: {
					order: 1,
					width: "3rem",
					fontWeight: "bold"
				}
			});
		} else {
			components_obj.key_input = new ve.Text(current_key, {
				onuserchange: (new_key) => {
					this._renameObjectKey(parent_object, current_key, new_key);
				},
				style: {
					order: 1,
					width: "6rem",
					color: "var(--color-primary)"
				}
			});
		}
		
		// 3. Separator (Order 2)
		components_obj.separator = new ve.HTML("<b>&nbsp;:&nbsp;</b>", {
			style: { order: 2, opacity: 0.5 }
		});
		
		// 4. Value Input (Order 3)
		// No marginLeft: auto here. It sits right next to the separator.
		
		if (!is_group) {
			if (type === "string") {
				components_obj.input = new ve.Text(current_data, {
					onuserchange: (v) => { parent_object[current_key] = v; this.fireToBinding(); },
					style: { order: 3, flex: "1 1 auto" } // Flex allows it to take available space if needed
				});
			} else if (type === "number") {
				components_obj.input = new ve.Number(current_data, {
					onuserchange: (v) => { parent_object[current_key] = v; this.fireToBinding(); },
					style: { order: 3 }
				});
			} else if (type === "boolean") {
				components_obj.input = new ve.Toggle(current_data, {
					onuserchange: (v) => { parent_object[current_key] = v; this.fireToBinding(); },
					on_name: "True",
					off_name: "False",
					style: { order: 3 }
				});
			} else {
				components_obj.input = new ve.HTML(`<span style="opacity:0.5">${String(current_data)}</span>`, {
					style: { order: 3 }
				});
			}
		} else {
			// Group Add Button
			components_obj.add_child_btn = new ve.Button((e) => {
				this._openAddModal(current_data);
			}, {
				name: "<icon>add</icon>",
				tooltip: "Add Item...",
				style: { order: 3 }
			});
		}
		
		// 5. Delete Button (Order 4)
		// This gets marginLeft: auto to push it to the far right edge of the container
		components_obj.delete_btn = new ve.Button((e) => {
			veConfirm(`Are you sure you want to delete "${current_key}"?`, {
				special_function: () => {
					if (Array.isArray(parent_object)) {
						parent_object.splice(current_key, 1);
					} else {
						delete parent_object[current_key];
					}
					this.refresh();
					this.fireToBinding();
				}
			});
		}, {
			name: "<icon>delete</icon>",
			tooltip: "Delete",
			style: {
				order: 4,
				color: "var(--color-error)"
			}
		});
		
		// Children
		if (is_group) {
			Object.keys(current_data).forEach((key) => {
				let safe_key = key;
				if (Array.isArray(current_data)) safe_key = parseInt(key);
				components_obj[`child_${key}`] = this._generateRecursive(current_data[key], safe_key, depth + 1, current_data);
			});
		}
		
		// Final HierarchyDatatype
		return new ve.HierarchyDatatype(components_obj, {
			name: (typeof current_key === "string") ? current_key : current_key.toString(),
			type: is_group ? "group" : "item",
			is_collapsed: (depth >= this.options.collapsed_depth),
			
			// Metadata for reordering
			data_container: parent_object,
			data_key: current_key,
			data_value: current_data,
			
			style: {
				".nst-content": {
					display: "flex",
					alignItems: "center",
					gap: "0px" // Removing gap to rely on element margins
				},
				'input': { maxWidth: "8rem" },
				width: "20rem"
			}
		});
	}
	
	_handleReorder(v, e) {
		let stop_data = e.on_stop_data;
		if (!stop_data) return;
		
		let moved_instance = stop_data.movedNode.instance;
		let original_parent_instance = stop_data.originalParentItem?.instance;
		let new_parent_instance = stop_data.newParentItem?.instance;
		
		let source_container = (original_parent_instance) ?
			original_parent_instance.options.data_value : this.value;
		
		let dest_container = (new_parent_instance) ?
			new_parent_instance.options.data_value : this.value;
		
		let key_to_move = moved_instance.options.data_key;
		let val_to_move = source_container[key_to_move];
		
		let parent_ol = stop_data.newParentItem ?
			stop_data.newParentItem.querySelector("ol") :
			this.element.querySelector("ol.ve-hierarchy");
		
		let siblings = Array.from(parent_ol.children).filter(el =>
			el.getAttribute("component") === "ve-hierarchy-datatype" && !el.classList.contains("actions-bar")
		);
		let new_index = siblings.indexOf(stop_data.movedNode);
		
		// Remove
		if (Array.isArray(source_container)) {
			source_container.splice(key_to_move, 1);
		} else {
			delete source_container[key_to_move];
		}
		
		// Add
		if (Array.isArray(dest_container)) {
			dest_container.splice(new_index, 0, val_to_move);
		} else {
			dest_container[key_to_move] = val_to_move;
		}
		
		this.refresh();
		this.fireToBinding();
	}
	
	refresh () {
		this.element.innerHTML = "";
		
		let actions_bar = new ve.HierarchyDatatype({
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
				marginTop: `calc(var(--padding))`,
				width: "20rem"
			}
		});
		
		let hierarchy_obj = { actions_bar: actions_bar };
		
		if (this.value && typeof this.value === "object") {
			Object.keys(this.value).forEach((key) => {
				let safe_key = key;
				if (Array.isArray(this.value)) safe_key = parseInt(key);
				hierarchy_obj[`root_${key}`] = this._generateRecursive(this.value[key], safe_key, 0, this.value);
			});
		}
		
		this.hierarchy = new ve.Hierarchy(hierarchy_obj, {
			disable_searchbar: false,
			searchbar_style: { marginBottom: "0" },
			onuserchange: (v, e) => this._handleReorder(v, e)
		});
		
		this.hierarchy.element.style.height = "100%";
		this.hierarchy.element.style.overflowY = "auto";
		
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