/**
 * <span color = "yellow">{@link ve.Component}</span>:ve.HierarchyDatatype
 * 
 * ##### Constructor:
 * - `arg0_value`: {@link Object}<{@link ve.Component}>
 * - `arg1_options`: {@link Object}
 *   - `.attributes`: {@link Object}
 *     - `<attribute_key>`: {@link string}
 *   - `.disabled=false`: {@link boolean}
 *   - `.id=Class.generateRandomID(ve.HierarchyDatatype)`: {@link string}
 *   - `.name`: {@link string}
 *   - `.onchange`: {@link function}(this:{@link ve.HierarchyDatatype})
 *   - `.style`: {@link Object}
 *     - `<style_key>`: {@link string}
 *   - `.type="item"`: {@link string} - Either 'item'/'group'.
 *     
 * ##### DOM:
 * - `.instance`: this:{@link ve.Button}
 *
 * ##### Instance:
 * - `.element`: {@link HTMLElement}
 * - `.name`: {@link string}
 * - `.v`: {@link Object}<{@link ve.Component}>
 * 
 * ##### Methods:
 * - <span color=00ffff>{@link ve.HierarchyDatatype.refresh|refresh}</span>()
 * - <span color=00ffff>{@link ve.HierarchyDatatype.remove|remove}</span>()
 * 
 * @function veHierarchyDatatype
 * @type {ve.veHierarchyDatatype}
 */
ve.HierarchyDatatype = class veHierarchyDatatype extends ve.Component {
	/*static demo_value = {
		name: veText(`Entry #${Math.randomNumber(0, 1000000)}`),
		context_menu_button: veButton((e) => {
			console.log(e);
		}, { name: "Options"})
	};*/
	static instances = [];
	
	constructor (arg0_components_obj, arg1_options) {
		//Convert from parameters
		let components_obj = (arg0_components_obj) ? arg0_components_obj : {};
		let options = (arg1_options) ? arg1_options : {};
			super(options);
		
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		options.type = (options.type) ? options.type : "item"; //Either 'item'/'group'
		
		//Declare local instance variables
		this.id = (options.id) ? options.id : Class.generateRandomID(ve.HierarchyDatatype);
		
		this.element = document.createElement("li");
			this.element.classList.add(options.type, "nst-item");
			if (options.disabled === true)
				this.element.setAttribute("data-nestable-disabled", "dragging");
			if (options.type === "item" && !options.disabled)
				this.element.setAttribute("data-nestable-disabled", "nesting");
			this.element.setAttribute("component", "ve-hierarchy-datatype");
			Object.iterate(options.attributes, (local_key, local_value) => {
				this.element.setAttribute(local_key, local_value.toString());
			});
			this.element.id = this.id;
			this.element.instance = this;
		this.is_vercengen_hierarchy_datatype = true;
		this.options = options;
		this.type = options.type;
		HTML.applyTelestyle(this.element, options.style);
		
		//Append components_obj elements to this.element
		this.components_obj = components_obj;
		this.refresh();
		if (options.name) this.name = options.name;
		ve.HierarchyDatatype.instances.push(this);
	}
	
	get name () {
		//Return statement
		return (this.components_obj.name) ? this.components_obj.name.v : "";
	}
	
	set name (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
		
		//Set name
		if (this.components_obj.name) {
			this.components_obj.name.v = value;
		} else {
			this.components_obj.name = new ve.Text(value, { disabled: this.options.disabled });
			this.v = this.components_obj;
		}
	}
	
	get v () {
		//Return statement
		return this.components_obj;
	}
	
	set v (arg0_components_obj) {
		//Convert from parameters
		let components_obj = arg0_components_obj;
		
		//Reset this.components_obj
		this.components_obj = components_obj;
		this.refresh();
		this.fireFromBinding();
	}
	
	/**
	 * Refreshes the display of this.components_obj within the present instance.
	 * - Method of: {@link ve.HierarchyDatatype}
	 * 
	 * @typedef ve.HierarchyDatatype.refresh
	 */
	refresh () {
		//Declare local instance variables
		let has_subitems = false;
		
		//0. Append .nst-handle el
		this.element.innerHTML = `<div class = "nst-handle">⋯</div>`;
		
		//1. Append regular components first as group components
		Object.iterate(this.components_obj, (local_key, local_value) => {
			if (!local_value.is_vercengen_hierarchy_datatype) {
				this.element.appendChild(local_value.element);
			} else {
				has_subitems = true;
			}
		});
		
		//2. Append ol components if .is_group resolves to true
		if (has_subitems && this.type === "group") {
			let ol_el = document.createElement("ol");
				ol_el.id = this.id;
			
			//Iterate over all this.components_obj and append the sublist at the end
			Object.iterate(this.components_obj, (local_key, local_value) => {
				if (local_value.is_vercengen_hierarchy_datatype)
					ol_el.appendChild(local_value.element);
			});
			this.element.appendChild(ol_el);
		}
	}
};