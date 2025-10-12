ve.Scene = class {
	constructor (arg0_components_obj, arg1_options) {
		//Convert from parameters
		let components_obj = (arg0_components_obj) ? arg0_components_obj : {};
		let options = (arg1_options) ? arg1_options : {};
		
		//Declare local instance variables
		this.components_obj = components_obj;
		this.element = document.createElement("div");
			this.element.setAttribute("class", "ve-feature-scene");
			this.element.instance = this;
			HTML.setAttributesObject(this.element, options.attributes);
			HTML.applyCSSStyle(this.element, {
				height: "100%",
				width: "100%",
				...options.style
			});
			
		//Append ve.scene_el
		ve.scene_el.appendChild(this.element);
		this.v = components_obj;
	}
	
	draw (arg0_function, arg1_interval) {
		//Convert from parameters
		let local_function = arg0_function;
		let interval = Math.returnSafeNumber(arg1_interval, 100);
		
		//Add this.draw_loop for element
		this.draw_loop = setInterval(() => {
			local_function(this);
		}, interval);
	}
	
	get v () {
		//Return statement
		return this.components_obj;
	}
	
	set v (arg0_components_obj) {
		//Convert from parameters
		let components_obj = (arg0_components_obj) ? arg0_components_obj : {};
		
		//Declare local instance variables
		this.components_obj = components_obj;
		
		//Iterate over this.components_obj after resetting this.element
		this.element.innerHTML = "";
		Object.iterate(this.components_obj, (local_key, local_value) => {
			if (this[local_key] === undefined) {
				this[local_key] = local_value;
			} else {
				console.error(`ve.Scene: ${local_key} is already defined and is thus a reserved keyword.`);
			}
			
			//Append local_value.element if present
			if (local_value.element)
				this.element.appendChild(local_value.element);
		});
	}
};