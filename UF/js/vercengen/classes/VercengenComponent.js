ve.Component = class {
	constructor (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Declare local instance variables
		let child_class = this.constructor;
		
		this.is_vercengen_component = true;
		
		this.height = options.height;
		this.width = options.width;
		this.x = options.x;
		this.y = options.y;
		
		this.options = options;
		
		//.onload handler
		if (this.options.onload)
			setTimeout(() => {
				this.options.onload(this);
			}, 100);
		
		//.tooltip handler
		if (this.options.tooltip)
			setTimeout(() => {
				this.tooltip = new ve.Tooltip(this.options.tooltip, { element: this.element });
			});
	}
	
	bind (arg0_container_el) {
		//Convert from parameters
		let container_el = arg0_container_el;
		
		//Set variable_key, append to container_el
		container_el.append(this.element);
	}
	
	//Runs over all ve classes that extend ve.Component and lint them
	static linter () {
		Object.iterate(global.ve, (local_key, local_value) => {
			try {
				if (Object.getPrototypeOf(local_value) === ve.Component) {
					let local_name = Object.getOwnPropertyDescriptor(local_value.prototype, "name");
					let local_v = Object.getOwnPropertyDescriptor(local_value.prototype, "v");
					
					let local_prefix = `ve.Component: ve.${local_key}`;
					
					if (!global[`ve${local_key}`]) {
						global[`ve${local_key}`] = function () {
							//Return statement
							return new ve[local_key](...arguments);
						};
					} else {
						console.error(`ve.${local_key} cannot have its functional binding registered, since it is already reserved elsewhere. Use Ctrl + F to find where it has been reserved in your codebase.`);
					}
					
					if (ve.debug_mode)
						if (local_value.demo_value === undefined)
							console.warn(`${local_prefix} does not have a set static .demo_value.`);
					
					//Check if get()/set() methods exist
					if (!local_v || typeof local_v.get !== "function")
						console.error(`${local_prefix} does not have a valid get v() function.`);
					if (!local_v || typeof local_v.set !== "function")
						console.error(`${local_prefix} does not have a valid set v() function.`);
					
					//Check if name() method exists
					if (!local_name || typeof local_name.get !== "function")
						console.error(`${local_prefix} does not have a valid get name() function. This is used to populate an inspector-like view with the key name if options.name is otherwise missing.`);
					if (!local_name || typeof local_name.set !== "function")
						console.error(`${local_prefix} does not have a valid set name() function. This is used to populate an inspector-like view with the key name if options.name is otherwise missing.`);
					
					//Check if remove() method exists
					if (typeof local_value.prototype.remove !== "function")
						console.error(`${local_prefix} does not have a valid remove() function to remove its corresponding DOM element upon being cleared.`);
				}
			} catch (e) { console.error(e); }
		});
	}
};