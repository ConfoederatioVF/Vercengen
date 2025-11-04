//Initialise methods
{
	Object.addGetterSetter = function (arg0_object, arg1_variable_string, arg2_options) { //[WIP] - Refactor later
		//Convert from parameters
		let object = arg0_object;
		let variable_string = (arg1_variable_string) ? arg1_variable_string : "";
		let options = (arg2_options) ? arg2_options : {};
		
		//Declare local instance variables
		let all_keys = variable_string.split(".");
		let current_obj = object;
		
		//Iterate up to the second-to-last key
		for (let i = 0; i < all_keys.length - 1; i++) try {
			if (current_obj[all_keys[i]] === undefined)
				current_obj[all_keys[i]] = {};
			current_obj = current_obj[all_keys[i]];
		} catch (e) { console.error(e); }
		
		//Set the value at the last key if available
		let old_value;
			//Try to clone, but fallback to original if it fails
			try {
				old_value = structuredClone(current_obj[all_keys[all_keys.length - 1]]);
			} catch {
				old_value = current_obj[all_keys[all_keys.length - 1]];
			}
		let internal_value = old_value;
		
		//Helper function to wrap objects/arrays with a Proxy for deep mutation tracking
		function createDeepProxy (target, root_on_change) {
			if (typeof target !== "object" || target === null) return target; //Internal guard clause if target is a non-object
			
			let handler = {
				set (obj, prop, value, receiver) {
					//If setting an object/array, make it a proxy too
					if (typeof value === "object" && value !== null)
						value = createDeepProxy(value, root_on_change);
					let result = Reflect.set(obj, prop, value, receiver);
					
					//Call the root change handler
					if (typeof root_on_change === "function") root_on_change();
					
					//Return statement
					return result;
				},
				deleteProperty (obj, prop) {
					let result = Reflect.deleteProperty(obj, prop);
					if (typeof root_on_change === "function") root_on_change();
					
					//Return statement
					return result;
				}
			};
			
			//Recursively proxy existing properties
			for (let key in target)
				if (target.hasOwnProperty(key) && typeof target[key] === "object" && target[key] !== null)
					target[key] = createDeepProxy(target[key], root_on_change);
			
			//Return statement
			return new Proxy(target, handler);
		}
		
		//Add getter/setter
		Object.defineProperty(current_obj, all_keys[all_keys.length - 1], {
			configurable: true,
			enumerable: true,
			get() {
				if (options.get_function)
					return options.get_function.call(this);
				return internal_value;
			},
			set(value) {
				//Always proxy objects/arrays, keep primitives as-is
				if (typeof value === "object" && value !== null) {
					internal_value = createDeepProxy(value, () => {
						if (typeof options.set_function === "function")
							options.set_function.call(this, internal_value);
					});
				} else {
					internal_value = value;
				}
				
				//Call set_function for initial assignment
				if (options.set_function)
					options.set_function.call(this, internal_value);
			}
		});
		
		//Return statement
		return old_value;
	};
	
	Object.getValue = function (arg0_object, arg1_variable_string) {
		//Convert from parameters
		let object = arg0_object;
		let variable_string = (arg1_variable_string) ? arg1_variable_string : "";
		
		//Return statement
		return variable_string.split(".")
			.reduce((local_object, local_key) => local_object?.[local_key], object);
	};
		
	/**
	 * Iterates over an object, with similar conventions to other Object static methods.
	 *
	 * @param {Object} arg0_object
	 * @param {function(arg0_local_key, arg1_local_value)|function(arg0_local_value)} arg1_function
	 */
	Object.iterate = function (arg0_object, arg1_function) {
		//Convert from parameters
		let object = arg0_object;
		let local_function = arg1_function;
		
		//Internal guard clauses
		if (typeof object !== "object")
			throw new Error("arg0_object is not of type Object.");
		if (!local_function)
			throw new Error("arg1_function is not defined.");
		if (local_function.length === 0)
			throw new Error("Invalid number of arguments accepted for arg1_function. Should either be (arg0_local_key, arg1_local_value), or less preferably, (arg0_local_value).");
		
		//Declare local instance variables
		let all_local_keys = Object.keys(object);
		
		if (local_function.length === 1) {
			for (let i = 0; i < all_local_keys.length; i++)
				local_function(object[all_local_keys[i]]);
		} else {
			for (let i = 0; i < all_local_keys.length; i++)
				local_function(all_local_keys[i], object[all_local_keys[i]]);
		}
	};
	
	Object.setValue = function (arg0_object, arg1_variable_string, arg2_value) {
		//Convert from parameters
		let object = arg0_object;
		let variable_string = (arg1_variable_string) ? arg1_variable_string : "";
		let value = arg2_value;
		
		//Declare local instance variables
		let all_keys = variable_string.split(".");
		let current_obj = object;
		
		//Iterate up to the second-to-last key
		for (let i = 0; i < all_keys.length - 1; i++) try {
			if (current_obj[all_keys[i]] === undefined)
				current_obj[all_keys[i]] = {};
			current_obj = current_obj[all_keys[i]];
		} catch (e) { console.error(e); }
		
		//Set the value at the last key if available
		current_obj[all_keys[all_keys.length - 1]] = value;
		
		//Return statement
		return current_obj[all_keys[all_keys.length - 1]];
	};
}
