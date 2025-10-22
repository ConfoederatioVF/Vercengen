/**
 * <span color = "yellow">{@link ve.Component}</span>:ve.Hierarchy
 * 
 * ##### Constructor:
 * - `arg0_components_obj`: {@link Object}<{@link ve.Component}>
 * - `arg1_options`: {@link Object}
 *   - `.attributes`: {@link Object}
 *     - `<attribute_key>`: {@link string}
 *   - `.name`: {@link string}
 *   - `.onchange`: {@link function}(this:{@link ve.Hierarchy})
 *   - `.style`: {@link Object}
 *     - `<style_key>`: {@link string}
 *     
 * ##### DOM:
 * - `.instance`: this:{@link ve.Hierarchy}
 * 
 * ##### Instance:
 * - `.element`: {@link HTMLElement}
 * - `.name`: {@link string}
 * - `.v`: {@link Object}<{@link ve.Component}>
 *   
 * ##### Methods:
 * - <span color=00ffff>{@link ve.Hierarchy.addItem|addItem}</span>(arg0_parent_el: {@link HTMLElement}|{@link string}, arg1_hierarchy_datatype: {@link ve.HierarchyDatatype})
 * - <span color=00ffff>{@link ve.Hierarchy.remove|remove}</span>()
 * - <span color=00ffff>{@link ve.Hierarchy.removeItem|removeItem}</span>(arg0_hierarchy_datatype: {@link ve.HierarchyDatatype})
 * 
 * @function veHierarchy
 * @type {ve.veHierarchy}
 */
ve.Hierarchy = class veHierarchy extends ve.Component {
	static reserved_keys = ["element", "id", "name"];
	
	constructor (arg0_components_obj, arg1_options) {
		//Convert from parameters
		let components_obj = (arg0_components_obj) ? arg0_components_obj : {};
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		
		//Declare local instance variables
		this.element = document.createElement("div");
		this.element.setAttribute("component", "ve-hierarchy");
		Object.iterate(options.attributes, (local_key, local_value) => {
			this.element.setAttribute(local_key, local_value.toString());
		});
		this.options = options;
		HTML.applyTelestyle(this.element, options.style);
		
		//Append components_obj to this.element
		this.v = components_obj;
	}
	
	addItem (arg0_parent_el, arg1_hierarchy_datatype) {
		//Convert from parameters
		let parent_el = (arg0_parent_el) ? arg0_parent_el : this.element.querySelector("ol");
		let hierarchy_datatype = arg1_hierarchy_datatype;
		
		//Append child
		if (typeof parent_el === "string") parent_el = this.element.querySelector(parent_el);
		if (parent_el)
			parent_el.appendChild(hierarchy_datatype.element);
	}
	
	/**
	 * Returns an object representative of the items in the hierarchy.
	 * 
	 * @param {Object} [arg0_options]
	 *  @param {boolean} [arg0_options.flatten_object=false] - Whether the object should be flattened, returning only serialisable JSON keys.
	 *  
	 * @returns {Object}
	 */
	getHierarchyObject (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Declare local instance variables
		let ol_el = this.element.querySelector("ol");
		
		//Return statement
		return HTML.listToObject(ol_el, (local_el) => {
			//Declare local instance variables
			let local_name = (local_el && local_el.instance && local_el.instance.name) ? 
				local_el.instance.name : "";
			
			//Return statement
			if (local_el.tagName === "OL") {
				try {
					local_name = local_el.parentElement.instance.name;
				} catch {}
				
				return {
					id: local_el.id,
					element: (!options.flatten_object) ? local_el : undefined,
					name: (local_name) ? local_name : undefined
				};
			} else if (local_el.tagName === "LI") {
				return {
					id: local_el.id,
					element: (!options.flatten_object) ? local_el : undefined,
					name: (local_name) ? local_name : undefined
				};
			}
		});
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
			this.components_obj.name = new ve.HTML(value);
			this.v = this.components_obj;
		}
	}
	
	remove () {
		this.element.remove();
	}
	
	removeItem (arg0_hierarchy_datatype) {
		//Convert from parameters
		let hierarchy_datatype = arg0_hierarchy_datatype;
		
		//Remove item
		hierarchy_datatype.remove();
	}
	
	get v () {
		//Return statement
		return this.components_obj;
	}
	
	set v (arg0_components_obj) {
		//Convert from parameters
		let components_obj = arg0_components_obj;
		
		//Reset element; re-append all components in components_obj to element 
		this.components_obj = components_obj;
		this.element.innerHTML = "";
		
		//1. Append all non-hierarchy datatype Vercengen components to controls; iterate over all this.components_obj
		Object.iterate(this.components_obj, (local_key, local_value) => {
			if (!local_value.is_vercengen_hierarchy_datatype)
				this.element.appendChild(local_value.element);
		});
		
		//2. Append all hierarchy datatype Vercengen components; iterate over all this.components_obj
		let ol_el = document.createElement("ol");
		ol_el.setAttribute("class", "list ve-drag-disabled ve-hierarchy");
		
		Object.iterate(this.components_obj, (local_key, local_value) => {
			if (local_value.is_vercengen_hierarchy_datatype)
				ol_el.appendChild(local_value.element);
		});
		this.element.appendChild(ol_el);
		this.nestable = new Nestable(ol_el, { items: ".group, .item" });
			this.nestable.on("stop", () => {
				if (this.options.onchange) this.options.onchange(this);
			});
	}
};