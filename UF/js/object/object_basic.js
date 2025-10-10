//Initialise methods
{
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
}
