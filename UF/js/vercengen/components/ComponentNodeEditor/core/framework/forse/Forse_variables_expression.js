ve.NodeEditor.Forse.variables_expression = {
	array_concatenate: {
		name: "Array Concat",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_array",
			type: "any[]"
		}, {
			name: "arg1_array",
			type: "any[]"
		}],
		output_type: "any[]",
		special_function: function (arg0_array, arg1_array) {
			//Convert from parameters
			let array = arg0_array;
			let ot_array = arg1_array;
			
			//Declare local instance variables
			let concat_array = array.concat(ot_array);
			
			//Return statement
			return {
				display_value: `any[${concat_array.length}]`,
				value: concat_array
			};
		}
	},
	array_indexof: {
		name: "Array Indexof",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_array",
			type: "any[]"
		}, {
			name: "arg1_element",
			type: "any"
		}],
		output_type: "number",
		special_function: function (arg0_array, arg1_element) {
			//Convert from parameters
			let array = arg0_array;
			let element = arg1_element;
			
			//Declare local instance variables
			let index = array.indexOf(element);
			
			//Return statement
			return {
				display_value: `${index}`,
				value: index
			};
		}
	},
	array_length: {
		name: "Array Length",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_array",
			type: "any[]"
		}],
		output_type: "number",
		special_function: function (arg0_array) {
			//Convert from parameters
			let array = arg0_array;
			
			//Return statement
			return {
				display_value: `${array.length}`,
				value: array.length
			};
		}
	},
	array_pop: {
		name: "Array Pop",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_array",
			type: "any[]"
		}],
		output_type: "any[]",
		special_function: function (arg0_array) {
			//Convert from parameters
			let array = arg0_array;
			
			//Declare local instance variables
			array.pop();
			
			//Return statement
			return {
				display_value: `any[${array.length}]`,
				value: array
			};
		}
	},
	array_push: {
		name: "Array Push",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_array",
			type: "any[]"
		}, {
			name: "arg1_element",
			type: "any"
		}],
		output_type: "any[]",
		special_function: function (arg0_array, arg1_element) {
			//Convert from parameters
			let array = arg0_array;
			let element = arg1_element;
			
			//Declare local instance variables
			array.push(element);
			
			//Return statement
			return {
				display_value: `Pushed ${element}`,
				value: array
			};
		}
	},
	array_reverse: {
		name: "Array Reverse",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_array",
			type: "any[]"
		}],
		output_type: "any[]",
		special_function: function (arg0_array) {
			//Convert from parameters
			let array = arg0_array;
			
			//Declare local instance variables
			let local_value = array.reverse();
			
			//Return statement
			return {
				display_value: `any[${local_value.length}]`,
				value: local_value
			};
		}
	},
	array_shift: {
		name: "Array Shift",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_array",
			type: "any[]"
		}],
		output_type: "any",
		special_function: function (arg0_array) {
			//Convert from parameters
			let array = arg0_array;
			
			//Declare local instance variables
			let shifted_element = array.shift();
			
			//Return statement
			return {
				display_value: `Shifted: ${shifted_element}`,
				value: shifted_element
			};
		}
	},
	array_splice: {
		name: "Array Splice",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_array",
			type: "any[]"
		}, {
			name: "arg1_index",
			type: "number"
		}, {
			name: "arg2_how_many",
			type: "number"
		}],
		output_type: "any[]",
		special_function: function (arg0_array, arg1_index, arg2_how_many) {
			//Convert from parameters
			let array = arg0_array;
			let index = arg1_index;
			let how_many = arg2_how_many;
			
			//Declare local instance variables
			array.splice(index, how_many);
			
			//Return statement
			return {
				display_value: `Spliced ${how_many} items`,
				value: array
			};
		}
	},
	array_unshift: {
		name: "Array Unshift",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_array",
			type: "any[]"
		}, {
			name: "arg1_element",
			type: "any"
		}],
		output_type: "any[]",
		special_function: function (arg0_array, arg1_element) {
			//Convert from parameters
			let array = arg0_array;
			let element = arg1_element;
			
			//Declare local instance variables
			array.unshift(element);
			
			//Return statement
			return {
				display_value: `Unshifted ${element}`,
				value: array
			};
		}
	},
	join_array: {
		name: "Join Array",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_array",
			type: "any[]"
		}, {
			name: "arg1_separator",
			type: "string"
		}],
		output_type: "string",
		special_function: function (arg0_array, arg1_separator) {
			//Convert from parameters
			let array = arg0_array;
			let separator = arg1_separator;
			
			//Declare local instance variables
			let result = array.join(separator);
			
			//Return statement
			return {
				display_value: `"${result}"`,
				value: result
			};
		}
	},
	split_string: {
		name: "Split String",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_string",
			type: "string"
		}, {
			name: "arg1_separator",
			type: "string"
		}],
		output_type: "string[]",
		special_function: function (arg0_string, arg1_separator) {
			//Convert from parameters
			let string = arg0_string;
			let separator = arg1_separator;
			
			//Declare local instance variables
			let result = string.split(separator);
			
			//Return statement
			return {
				display_value: `${result.length} Elements`,
				value: result
			};
		}
	},
	
	//Object
	concatenate_objects: {
		name: "Merge Objects",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_object",
			type: "any"
		}, {
			name: "arg1_object",
			type: "any"
		}],
		output_type: "any",
		special_function: function (arg0_object, arg1_object) {
			//Convert from parameters
			let object = arg0_object;
			let ot_object = arg1_object;
			
			//Declare local instance variables
			let merged = Object.assign({}, object, ot_object);
			
			//Return statement
			return {
				display_value: `Merged Object`,
				value: merged
			};
		}
	},
	get_object_keys: {
		name: "Get Object Keys",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_object",
			type: "any"
		}],
		output_type: "string[]",
		special_function: function (arg0_object) {
			//Convert from parameters
			let object = arg0_object;
			
			//Declare local instance variables
			let keys = Object.keys(object);
			
			//Return statement
			return {
				display_value: `${keys.length} Keys`,
				value: keys
			};
		}
	},
	get_object_values: {
		name: "Get Object Values",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_object",
			type: "any"
		}],
		output_type: "any[]",
		special_function: function (arg0_object) {
			//Convert from parameters
			let object = arg0_object;
			
			//Declare local instance variables
			let values = Object.values(object);
			
			//Return statement
			return {
				display_value: `${values.length} Values`,
				value: values
			};
		}
	},
	
	//Number
	add_numbers: {
		name: "Add Numbers",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_number",
			type: "number"
		}, {
			name: "arg1_number",
			type: "number"
		}],
		output_type: "number",
		special_function: function (arg0_number, arg1_number) {
			//Convert from parameters
			let number = arg0_number;
			let ot_number = arg1_number;
			
			//Declare local instance variables
			let sum = number + ot_number;
			
			//Return statement
			return {
				display_value: `${sum}`,
				value: sum
			};
		}
	},
	exponentiate_numbers: {
		name: "Exponentiate Numbers",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_number",
			type: "number"
		}, {
			name: "arg1_number",
			type: "number"
		}],
		output_type: "number",
		special_function: function (arg0_number, arg1_number) {
			//Convert from parameters
			let number = arg0_number;
			let ot_number = arg1_number;
			
			//Declare local instance variables
			let result = Math.pow(number, ot_number);
			
			//Return statement
			return {
				display_value: `${result}`,
				value: result
			};
		}
	},
	modulo_numbers: {
		name: "Modulo",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_number",
			type: "number"
		}, {
			name: "arg1_number",
			type: "number"
		}],
		output_type: "number",
		special_function: function (arg0_number, arg1_number) {
			//Convert from parameters
			let number = arg0_number;
			let ot_number = arg1_number;
			
			//Declare local instance variables
			let result = number % ot_number;
			
			//Return statement
			return {
				display_value: `${result}`,
				value: result
			};
		}
	},
	multiply_numbers: {
		name: "Multiply Numbers",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_number",
			type: "number"
		}, {
			name: "arg1_number",
			type: "number"
		}],
		output_type: "number",
		special_function: function (arg0_number, arg1_number) {
			//Convert from parameters
			let number = arg0_number;
			let ot_number = arg1_number;
			
			//Declare local instance variables
			let result = number * ot_number;
			
			//Return statement
			return {
				display_value: `${result}`,
				value: result
			};
		}
	},
	divide_numbers: {
		name: "Divide Numbers",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_number",
			type: "number"
		}, {
			name: "arg1_number",
			type: "number"
		}],
		output_type: "number",
		special_function: function (arg0_number, arg1_number) {
			//Convert from parameters
			let number = arg0_number;
			let ot_number = arg1_number;
			
			//Declare local instance variables
			let result = number / ot_number;
			
			//Return statement
			return {
				display_value: `${result}`,
				value: result
			};
		}
	},
	subtract_numbers: {
		name: "Subtract Numbers",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_number",
			type: "number"
		}, {
			name: "arg1_number",
			type: "number"
		}],
		output_type: "number",
		special_function: function (arg0_number, arg1_number) {
			//Convert from parameters
			let number = arg0_number;
			let ot_number = arg1_number;
			
			//Declare local instance variables
			let result = number - ot_number;
			
			//Return statement
			return {
				display_value: `${result}`,
				value: result
			};
		}
	},
	
	//String
	add_strings: {
		name: "Add Strings",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_string",
			type: "string"
		}, {
			name: "arg1_string",
			type: "string"
		}],
		output_type: "string",
		special_function: function (arg0_string, arg1_string) {
			//Convert from parameters
			let string = arg0_string;
			let ot_string = arg1_string;
			
			//Declare local instance variables
			let result = string + ot_string;
			
			//Return statement
			return {
				display_value: result,
				value: result
			};
		}
	},
	string_endswith: {
		name: "Ends With",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_string",
			type: "string"
		}, {
			name: "arg1_search",
			type: "string"
		}],
		output_type: "boolean",
		special_function: function (arg0_string, arg1_search) {
			//Convert from parameters
			let string = arg0_string;
			let search = arg1_search;
			
			//Declare local instance variables
			let result = string.endsWith(search);
			
			//Return statement
			return {
				display_value: result ? "True" : "False",
				value: result
			};
		}
	},
	string_matches: {
		name: "Matches",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_string",
			type: "string"
		}, {
			name: "arg1_regex",
			type: "string"
		}],
		output_type: "string[]",
		special_function: function (arg0_string, arg1_regex) {
			//Convert from parameters
			let string = arg0_string;
			let regex_string = arg1_regex;
			
			//Declare local instance variables
			let regex = new RegExp(regex_string, "g");
			let result = string.match(regex) || [];
			
			//Return statement
			return {
				display_value: `${result.length} Matches`,
				value: result
			};
		}
	},
	string_replace: {
		name: "Replace",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_string",
			type: "string"
		}, {
			name: "arg1_pattern",
			type: "string"
		}, {
			name: "arg2_replacement",
			type: "string"
		}],
		output_type: "string",
		special_function: function (arg0_string, arg1_pattern, arg2_replacement) {
			//Convert from parameters
			let string = arg0_string;
			let pattern = arg1_pattern;
			let replacement = arg2_replacement;
			
			//Declare local instance variables
			let result = string.replace(pattern, replacement);
			
			//Return statement
			return {
				display_value: result,
				value: result
			};
		}
	},
	string_replace_all: {
		name: "Replace All",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_string",
			type: "string"
		}, {
			name: "arg1_pattern",
			type: "string"
		}, {
			name: "arg2_replacement",
			type: "string"
		}],
		output_type: "string",
		special_function: function (arg0_string, arg1_pattern, arg2_replacement) {
			//Convert from parameters
			let string = arg0_string;
			let pattern = arg1_pattern;
			let replacement = arg2_replacement;
			
			//Declare local instance variables
			let result = string.replaceAll(pattern, replacement);
			
			//Return statement
			return {
				display_value: result,
				value: result
			};
		}
	},
	string_length: {
		name: "String Length",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_string",
			type: "string"
		}],
		output_type: "number",
		special_function: function (arg0_string) {
			//Convert from parameters
			let string = arg0_string;
			
			//Return statement
			return {
				display_value: `${string.length}`,
				value: string.length
			};
		}
	},
	string_startswith: {
		name: "Starts With",
		category: "Variables (Expressions)",
		input_parameters: [{
			name: "arg0_string",
			type: "string"
		}, {
			name: "arg1_search",
			type: "string"
		}],
		output_type: "boolean",
		special_function: function (arg0_string, arg1_search) {
			//Convert from parameters
			let string = arg0_string;
			let search = arg1_search;
			
			//Declare local instance variables
			let result = string.startsWith(search);
			
			//Return statement
			return {
				display_value: result ? "True" : "False",
				value: result
			};
		}
	}
};