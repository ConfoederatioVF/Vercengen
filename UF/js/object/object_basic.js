//Initialise methods
{
	Object.addGetterSetter = function (arg0_object, arg1_variable_string, arg2_options) { //[WIP] - Finish function body
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
			try { old_value = structuredClone(current_obj[all_keys[all_keys.length - 1]]); } catch (e) {}
		
		let internal_value = old_value;
		
		//Helper function to wrap objects/arrays with a Proxy for deep mutation tracking - [WIP] - Refactor at a later date
		function createDeepProxy (arg0_target, arg1_onchange) {
			//Convert from parameters
			let target = arg0_target, onChange = arg1_onchange;
			
			if (typeof target !== "object" || target === null) return target;
			
			let handler = {
				set (obj, prop, value, receiver) {
					const result = Reflect.set(obj, prop, value, receiver);
					if (typeof value === "object" && value !== null) {
						obj[prop] = createDeepProxy(value, onChange);
					}
					if (typeof onChange === "function") onChange(obj);
					return result;
				},
				deleteProperty (obj, prop) {
					const result = Reflect.deleteProperty(obj, prop);
					if (typeof onChange === "function") onChange(obj);
					return result;
				}
			};
			
			//Proxy recursion for existing object properties/array values
			Object.keys(target).forEach((k) => {
				if (typeof target[k] === "object" && target[k] !== null)
					target[k] = createDeepProxy(target[k], onChange);
			});
			
			//Return statement
			return new Proxy(target, handler);
		}
		
		//Add getter/setter
		Object.defineProperty(current_obj, all_keys[all_keys.length - 1], {
			configurable: true,
			enumerable: true,
			
			get () {
				if (options.get_function)
					//Return statement
					return options.get_function.call(this);
				return internal_value;
			},
			set (arg0_value) {
				//Convert from parameters
				let value = arg0_value;
				
				//Pseudo-return statement
				if (typeof value === "object" && value !== null) {
					let change_handler = (local_value) => {
						//On mutation, treat it as a 'set'
						if (typeof options.set_function === "function") {
							options.set_function.call(this, local_value);
						} else {
							internal_value = local_value;
						}
					};
					internal_value = createDeepProxy(value, change_handler);
				} else {
					internal_value = value;
				}
				
				if (options.set_function)
					options.set_function.call(this, value);
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
