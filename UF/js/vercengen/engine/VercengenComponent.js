ve.Component = class {
	constructor (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Declare local instance variables
		this.child_class = this.constructor;
		this.is_vercengen_component = true;
		
		this.height = options.height;
		this.width = options.width;
		this.x = options.x;
		this.y = options.y;
		
		//Binding handlers; setTimeout() is necessary to tick a frame until ve.Component child class's constructor populates
		setTimeout(() => {
			if (this.options === undefined)
				this.options = options; //Preferably overridden by lower components
			
			//Flow control handlers
			//.binding handler (bidirectional)
			if (this.options.binding) {
				this.from_binding = this.options.binding; //onprogramchange
				this.to_binding = this.options.binding; //onuserchange
			}
			//.from_binding handler (unidirectional, onprogramchange, variable -> this)
			if (this.options.from_binding)
				this.from_binding  = this.options.from_binding;
			//.to_binding handler (unidirectional, onuserchange, this -> variable)
			if (this.options.to_binding)
				this.to_binding = this.options.to_binding;
			
			//Event handlers
			//.onload handler
			if (this.options.onload)
				setTimeout(() => {
					this.options.onload(this);
				}, 100);
			
			//KEEP AT BOTTOM! - Feature/UI handlers
			//.limit handler
			if (this.options.limit) 
				this.limit = this.options.limit;
			
			//.tooltip handler
			if (this.options.tooltip)
				this.tooltip = new ve.Tooltip(this.options.tooltip, { element: this.element });
		});
	}
	
	//ve.Component getters/setters
	
	get limit () {
		//Return statement
		return (this.limit_function) ? this.limit_function(this.v, this) : true;
	}
	
	set limit (arg0_function) {
		//Convert from parameters
		this.limit_function = arg0_function;
		
		if (this.limit_function !== undefined) {
			this.limit_logic_loop = setInterval(() => {
				if (!this.limit) {
					this.removeComponent();
				} else {
					this.addComponent();
				}
			}, 100);
		} else {
			delete this.limit_function;
			clearInterval(this.limit_logic_loop);
			delete this.limit_logic_loop;
		}
	}
	
	//ve.Component directional flow functions - [WIP] - Reduce redundancy with parsing variablee_string
	
	/**
	 * Pseudo-setter from binding. Fires only upon program-driven changes to .v directly, which means that this has to be monitored manually component-side in set v(). This should always come last in set v().
	 */
	fireFromBinding () {
		//Convert from parameters
		let variable_string = (this.from_binding_string) ? JSON.parse(JSON.stringify(this.from_binding_string)) : undefined;
			if (variable_string === undefined) return; //Internal guard clause if variable_string is undefined
		
		//Declare local instance variables
		let initial_object = global;
		
		//Parse this to this.owner; watch mutation using getter/setter, and set this.v to new value
		if (variable_string.startsWith("this.")) {
			variable_string = variable_string.replace("this.", "");
			initial_object = this.owner;
		} else if (variable_string.startsWith("window.")) {
			variable_string = variable_string.replace("window.", "");
			initial_object = window;
		} else {
			variable_string = variable_string.replace("global.", "");
		}
		
		//Set this.from_binding in a to binding manner
		if (this.from_binding_string) {
			this.from_binding_fire_silently = true;
			Object.setValue(initial_object, variable_string, this.v);
			delete this.from_binding_fire_silently;
			
			if (typeof this.options.onchange === "function") //Fire onchange (bidirectional)
				this.options.onchange(this.v, this);
			if (typeof this.options.onprogramchange === "function") //Fire onprogramchange (unidirectional)
				this.options.onprogramchange(this.v, this);
		}
	}
	
	/**
	 * Pseudo-setter to binding. Fires only upon user-driven changes, which means that this has to be monitored manually component-side.
	 */
	fireToBinding () {
		//Declare local instance variables
		let initial_object = global;
		let variable_string = this.to_binding;
		
		//Internal guard clause if this.to_binding is not defined
		if (this.to_binding) {
			if (typeof this.to_binding !== "string") {
				console.error(`ve.Component: ${this.child_class.prototype.constructor.name}: this.to_binding is an invalid string:`, this.to_binding);
				return;
			}
			
			//Parse this to this.owner; watch variable mutation using getter/setter, and set this.v to new value
			if (variable_string.startsWith("this.")) {
				variable_string = variable_string.replace("this.", "");
				initial_object = this.owner;
			} else if (variable_string.startsWith("window.")) {
				variable_string = variable_string.replace("window.", "");
				initial_object = window;
			} else {
				variable_string = variable_string.replace("global.", "");
			}
		}
		
		//Set value of to object by fetching this.v
		let local_value = this.v; //Because this is a getter, run it once
		//console.log(initial_object, variable_string, local_value);
		
		if (typeof this.options.onchange === "function") //Fire onchange (bidirectional)
			this.options.onchange(local_value, this);
		if (typeof this.options.onuserchange === "function") //Fire onuserchange (unidirectional)
			this.options.onuserchange(local_value, this);
		
		if (this.to_binding)
			Object.setValue(initial_object, variable_string, local_value);
	}
	
	set from_binding (arg0_variable_string) {
		//Convert from parameters
		let variable_string = arg0_variable_string;
		
		//Declare local instance variables
		let initial_object = global;
		this.from_binding_string = variable_string;
		
		try {
			//Parse this to this.owner; watch variable mutation using getter/setter, and set this.v to new value
			if (variable_string.startsWith("this.")) {
				variable_string = variable_string.replace("this.", "");
				initial_object = this.owner;
			} else if (variable_string.startsWith("window.")) {
				variable_string = variable_string.replace("window.", "");
				initial_object = window;
			} else {
				variable_string = variable_string.replace("global.", "");
			}
			
			//Set init value if applicable
			this.v = Object.getValue(initial_object, variable_string);
			
			//Add getter/setter
			Object.addGetterSetter(initial_object, variable_string, {
				set_function: (arg0_value) => {
					//Convert from parameters
					let local_value = arg0_value;
					if (this.from_binding_fire_silently) return;
					
					//Declare local instance variables
					let is_same_value = Boolean.strictEquality(local_value, this.v);
					if (is_same_value) return;
					
					if (typeof this.options.onchange === "function") //Fire onchange (bidirectional)
						this.options.onchange(local_value, this);
					if (typeof this.options.onprogramchange === "function") //Fire onprogramchange (unidirectional)
						this.options.onprogramchange(local_value, this);
					this.v = local_value;
				}
			});
		} catch (e) {
			let error_array = [];
				error_array.push(`ve.Component: ${this.child_class.prototype.constructor.name}: this.from_binding failed. Are you sure you called this.updateOwner() synchronously in your constructor?`);
				if (initial_object === undefined)
					error_array.push(`- this.updateOwner() has not been called synchronously (check constructors and/or ve.Component updates).`);
			console.error(`${error_array.join("\n")}\n- initial_object:`, initial_object, `variable_string:`, variable_string);
		}
	}
	
	setOwner (arg0_value, arg1_owner_array) {
		//Convert from parameters
		let value = arg0_value;
		let owner_array = (arg1_owner_array) ? arg1_owner_array : [this];
		
		//Declare local instance variables
		this.owner = value;	
		this.owners = [].concat(owner_array); //Mutate to avoid shallow copies
		
		//Iterate over all this.child_class_argument_names and recursively drill down owners
		if (this.components_obj) {
			owner_array.push(this);
			
			Object.iterate(this.components_obj, (local_key, local_value) => {
				local_value.setOwner(value, owner_array);
			});
		}
	}
	
	//ve.Component UI functions
	
	addComponent () {
		if (this.parent_el) try {
			if (!this.parent_el.contains(this.element))
				this.parent_el.appendChild(this.element);
		} catch (e) { console.error(e); }
	}
	
	bind (arg0_container_el) {
		//Convert from parameters
		let container_el = arg0_container_el;
		
		//Set variable_key, append to container_el
		container_el.append(this.element);
	}
	
	removeComponent () {
		if (this.element.parentElement) try {
			if (this.element.parentElement.contains(this.element)) {
				this.parent_el = this.element.parentElement;
				this.parent_el.removeChild(this.element);
			}
		} catch (e) { console.error(e); }
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