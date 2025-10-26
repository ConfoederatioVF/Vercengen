if (!global.ve) global.ve = {};

ve.Feature = class {
	constructor (arg0_components_obj, arg1_options) {
		//Convert from parameters
		let components_obj = arg0_components_obj;
		let options = (arg1_options) ? arg1_options : {};
		
		//Declare local instance variables
		this.child_class = this.constructor;
		this.child_class_obj = ve[this.child_class.prototype.constructor.name];
		this.is_vercengen_feature = true;
		if (typeof components_obj === "function" || typeof components_obj === "string") {
			this.components_obj = {
				html: new ve.HTML(components_obj)
			};
		} else if (components_obj.is_vercengen_component) {
			this.components_obj = {
				component: components_obj
			};
		} else {
			this.components_obj = components_obj;
		}
		this.options = (arg1_options) ? arg1_options : {};
		
		//Destructure this.components_obj into available variables
		try {
			Object.iterate(this.components_obj, (local_key, local_value) => {
				if (!this[local_key]) this[local_key] = local_value;
			});
		} catch (e) { console.error(e); }
	}
	
	addComponents (arg0_components_obj) {
		//Convert from parameters
		let components_obj = (arg0_components_obj) ? arg0_components_obj : {};
		
		//Iterate over all components_obj
		Object.iterate(components_obj, (local_key, local_value) => {
			try {
				//Remove any extant element that already exists
				if (this.components_obj[local_key])
					this.removeComponent(this.components_obj[local_key]);
				
				//Set and destructure new component in this.components_obj
				if (!this[local_key]) this[local_key] = local_value;
				if (this.element)
					this.element.appendChild(local_value.element);
				this.components_obj[local_key] = local_value;
			} catch (e) { console.error(e); }
		});
		
	}
	
	close () {
		this.remove();
	}
	
	remove () {
		//Iterate over all instances in ve.Window.instances
		if (this.child_class_obj && this.child_class_obj.instances && this.id)
			for (let i = 0; i < this.child_class_obj.instances.length; i++)
				if (this.child_class_obj.instances[i].id === this.id) {
					this.child_class_obj.instances.splice(i, 1);
					break;
				}
		
		//Remove element
		if (this.element) this.element.remove();
	}
	
	removeComponents (arg0_components_obj) {
		//Convert from parameters
		let components_obj = (arg0_components_obj) ? arg0_components_obj : {};
		
		//Iterate over all components_obj and remove them based on keys
		Object.iterate(components_obj, (local_key, local_value) => {
			try {
				if (this.components_obj[local_key])
					this.components_obj[local_key].remove();
				local_value.remove();
				delete this.components_obj[local_key];
			} catch (e) { console.error(e); }
		});
	}
};