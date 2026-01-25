ve.NodeEditor.Forse.conditionals = {
	//Conditionals
	is_equal: {
		name: "Is Equal",
		
		category: "Conditionals",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}, {
			name: "arg1_variable",
			type: "any"
		}],
		output_type: "boolean",
		special_function: (arg0_variable, arg1_variable) => {
			return {
				display_value: (arg0_variable == arg1_variable) ? "True" : "False",
				value: (arg0_variable == arg1_variable)
			};
		}
	},
	is_strictly_equal: {
		name: "Is Strictly Equal",
		category: "Conditionals",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}, {
			name: "arg1_variable",
			type: "any"
		}],
		output_type: "boolean",
		special_function: (arg0_variable, arg1_variable) => {
			return {
				display_value: (arg0_variable === arg1_variable) ? "True" : "False",
				value: (arg0_variable === arg1_variable)
			};
		}
	},
	is_not_equal: {
		name: "Is Not Equal",
		category: "Conditionals",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}, {
			name: "arg1_variable",
			type: "any"
		}],
		output_type: "boolean",
		special_function: (arg0_variable, arg1_variable) => {
			return {
				display_value: (arg0_variable != arg1_variable) ? "True" : "False",
				value: (arg0_variable != arg1_variable)
			};
		}
	},
	is_not_strictly_equal: {
		name: "Is Not Equal",
		category: "Conditionals",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}, {
			name: "arg1_variable",
			type: "any"
		}],
		output_type: "boolean",
		special_function: (arg0_variable, arg1_variable) => {
			return {
				display_value: (arg0_variable !== arg1_variable) ? "True" : "False",
				value: (arg0_variable !== arg1_variable)
			};
		}
	},
	geq: {
		name: "Greater or Equal Than",
		category: "Conditionals",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}, {
			name: "arg1_variable",
			type: "any"
		}],
		output_type: "boolean",
		special_function: (arg0_variable, arg1_variable) => {
			return {
				display_value: (arg0_variable >= arg1_variable) ? "True" : "False",
				value: (arg0_variable >= arg1_variable)
			};
		}
	},
	greater_than: {
		name: "Greater Than",
		category: "Conditionals",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}, {
			name: "arg1_variable",
			type: "any"
		}],
		output_type: "boolean",
		special_function: (arg0_variable, arg1_variable) => {
			return {
				display_value: (arg0_variable > arg1_variable) ? "True" : "False",
				value: (arg0_variable > arg1_variable)
			};
		}
	},
	leq: {
		name: "Less Than or Equal To",
		category: "Conditionals",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}, {
			name: "arg1_variable",
			type: "any"
		}],
		output_type: "boolean",
		special_function: (arg0_variable, arg1_variable) => {
			return {
				display_value: (arg0_variable <= arg1_variable) ? "True" : "False",
				value: (arg0_variable <= arg1_variable)
			};
		}
	},
	less_than: {
		name: "Less Than",
		category: "Conditionals",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}, {
			name: "arg1_variable",
			type: "any"
		}],
		output_type: "boolean",
		special_function: (arg0_variable, arg1_variable) => {
			return {
				display_value: (arg0_variable < arg1_variable) ? "True" : "False",
				value: (arg0_variable < arg1_variable)
			};
		}
	},
	
	//Conditionals (If Statements)
	if_then: {
		name: "If Then",
		category: "Conditionals",
		input_parameters: [{
			name: "arg0_boolean",
			type: "boolean"
		}],
		output_type: "boolean",
		special_function: (arg0_boolean) => {
			return {
				abort: (!arg0_boolean),
				display_value: (arg0_boolean) ? "True" : "False",
				value: arg0_boolean
			};
		}
	},
	"false": {
		name: "False",
		category: "Conditionals",
		output_type: "boolean",
		special_function: () => {
			return {
				display_value: "False",
				value: false
			};
		}
	},
	"true": {
		name: "True",
		category: "Conditionals",
		output_type: "boolean",
		special_function: () => {
			return {
				display_value: "True",
				value: true
			};
		}
	},
	"null": {
		name: "Null",
		category: "Conditionals",
		output_type: "any",
		special_function: () => {
			return {
				display_value: "null",
				value: null
			};
		}
	},
	"undefined": {
		name: "Undefined",
		category: "Conditionals",
		output_type: "any",
		special_function: () => {
			return {
				display_value: "undefined",
				value: undefined
			};
		}
	},
	
	//Conditionals (Logic)
	and: {
		name: "AND",
		category: "Conditionals",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}, {
			name: "arg1_variable",
			type: "any"
		}],
		output_type: "boolean",
		special_function: (arg0_variable, arg1_variable) => {
			return {
				display_value: (arg0_variable && arg1_variable) ? "True" : "False",
				value: (arg0_variable && arg1_variable)
			};
		}
	},
	not: {
		name: "NOT",
		category: "Conditionals",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}],
		output_type: "boolean",
		special_function: (arg0_variable) => {
			return {
				display_value: (!arg0_variable) ? "True" : "False",
				value: (!arg0_variable)
			};
		}
	},
	or: {
		name: "OR",
		category: "Conditionals",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}, {
			name: "arg1_variable",
			type: "any"
		}],
		output_type: "boolean",
		special_function: (arg0_variable, arg1_variable) => {
			return {
				display_value: (arg0_variable || arg1_variable) ? "True" : "False",
				value: (arg0_variable || arg1_variable)
			};
		}
	},
	xor: {
		name: "XOR",
		category: "Conditionals",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}, {
			name: "arg1_variable",
			type: "any"
		}],
		output_type: "boolean",
		special_function: (arg0_variable, arg1_variable) => {
			let is_false = false;
			
			if (arg0_variable && arg1_variable) is_false = true;
			if (!arg0_variable && !arg1_variable) is_false = true;
			
			return {
				display_value: (!is_false) ? "True" : "False",
				value: (!is_false)
			};
		}
	},
};