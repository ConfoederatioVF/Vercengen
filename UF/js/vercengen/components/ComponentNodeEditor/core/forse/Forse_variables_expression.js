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
			let concat_array = arg0_array.concat(arg1_array)
			
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
			let index = arg0_array.indexOf(arg1_element);
			
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
			return {
				display_value: `${arg0_array.length}`,
				value: arg0_array.length
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
			arg0_array.pop();
			
			return {
				display_value: `any[${arg0_array.length}]`,
				value: arg0_array
			}
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
			arg0_array.push(arg1_element);
			
			return {
				display_value: `Pushed ${arg1_element}`,
				value: arg0_array
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
			let local_value = arg0_array.reverse();
			
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
			let shifted_element = arg0_array.shift();
			
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
			arg0_array.splice(arg1_index, arg2_how_many);
			
			return {
				display_value: `Spliced ${arg2_how_many} items`,
				value: arg0_array
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
			arg0_array.unshift(arg1_element);
			
			return {
				display_value: `Unshifted ${arg1_element}`,
				value: arg0_array
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
			let result = arg0_array.join(arg1_separator);
			
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
			let result = arg0_string.split(arg1_separator);
			
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
			let merged = Object.assign({}, arg0_object, arg1_object);
			
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
			let keys = Object.keys(arg0_object);
			
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
			let values = Object.values(arg0_object);
			
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
			let sum = arg0_number + arg1_number;
			
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
			let result = Math.pow(arg0_number, arg1_number);
			
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
			let result = arg0_number % arg1_number;
			
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
			let result = arg0_number * arg1_number;
			
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
			let result = arg0_number / arg1_number;
			
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
			let result = arg0_number - arg1_number;
			
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
			let result = arg0_string + arg1_string;
			
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
			let result = arg0_string.endsWith(arg1_search);
			
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
			let regex = new RegExp(arg1_regex, "g");
			let result = arg0_string.match(regex) || [];
			
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
			let result = arg0_string.replace(arg1_pattern, arg2_replacement);
			
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
			let result = arg0_string.replaceAll(arg1_pattern, arg2_replacement);
			
			return {
				display_value: result,
				value: result
			};
		}``
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
			return {
				display_value: `${arg0_string.length}`,
				value: arg0_string.length
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
			let result = arg0_string.startsWith(arg1_search);
			
			return {
				display_value: result ? "True" : "False",
				value: result
			};
		}
	}
};