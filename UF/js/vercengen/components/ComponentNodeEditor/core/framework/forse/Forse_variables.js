ve.NodeEditor.Forse.variables_get_obj = {
	category: "Variables",
	input_parameters: [{
		name: "arg0_key",
		type: "string"
	}],
	special_function: function (arg0_key) {
		return {
			display_value: `${arg0_key}: ${this.main.variables[arg0_key]}`,
			value: this.main.variables[arg0_key]
		};
	}
};
ve.NodeEditor.Forse.variables = {
	//Variables
	set_any: {
		name: "Set Any",
		category: "Variables",
		input_parameters: [{
			name: "arg0_key",
			type: "string"
		}, {
			name: "arg1_value",
			type: "any"
		}],
		output_type: "any",
		special_function: function (arg0_key, arg1_value) {
			//Convert from parameters
			let key = arg0_key;
			let value = arg1_value;
			
			//Declare local instance variables
			this.main.variables[key] = value;
			
			//Return statement
			return {
				display_value: `${key}: ${value}`,
				value: value
			};
		}
	},
	set_string_array: {
		name: "Set String Array",
		category: "Variables",
		input_parameters: [{
			name: "arg0_key",
			type: "string"
		}, {
			name: "arg1_value",
			type: "string"
		}],
		output_type: "string[]",
		special_function: function (arg0_key, arg1_value) {
			//Convert from parameters
			let key = arg0_key;
			let value = arg1_value;
			
			//Declare local instance variables
			this.main.variables[key] = value.split(",");
			let local_value = this.main.variables[key];
			
			//Iterate over all local_value elements and cast to string
			for (let i = 0; i < local_value.length; i++)
				if (local_value[i].toString)
					local_value[i] = local_value[i].toString();
			
			//Return statement
			return {
				display_value: `${key}: ${local_value.length} Elements`,
				value: this.main.variables[key]
			};
		}
	},
	set_number_array: {
		name: "Set Number Array",
		category: "Variables",
		input_parameters: [{
			name: "arg0_key",
			type: "string"
		}, {
			name: "arg1_value",
			type: "string"
		}],
		output_type: "number[]",
		special_function: function (arg0_key, arg1_value) {
			//Convert from parameters
			let key = arg0_key;
			let value = arg1_value;
			
			//Declare local instance variables
			this.main.variables[key] = value.split(",").map(parseFloat);
			let local_value = this.main.variables[key];
			
			//Return statement
			return {
				display_value: `${key}: ${local_value.length} Elements`,
				value: this.main.variables[key]
			};
		}
	},
	set_boolean: {
		name: "Set Boolean",
		category: "Variables",
		input_parameters: [{
			name: "arg0_key",
			type: "string"
		}, {
			name: "arg1_value",
			type: "boolean"
		}],
		output_type: "boolean",
		special_function: function (arg0_key, arg1_value) {
			//Convert from parameters
			let key = arg0_key;
			let value = arg1_value;
			
			//Declare local instance variables
			this.main.variables[key] = value;
			
			//Return statement
			return {
				display_value: (value) ? `${key}: True` : `${key}: False`,
				value: value
			};
		}
	},
	set_number: {
		name: "Set Number",
		category: "Variables",
		input_parameters: [{
			name: "arg0_key",
			type: "string"
		}, {
			name: "arg1_value",
			type: "number"
		}],
		output_type: "number",
		special_function: function (arg0_key, arg1_value) {
			//Convert from parameters
			let key = arg0_key;
			let value = arg1_value;
			
			//Declare local instance variables
			this.main.variables[key] = value;
			
			//Return statement
			return {
				display_value: `${key}: ${value}`,
				value: value
			};
		}
	},
	set_string: {
		name: "Set String",
		category: "Variables",
		input_parameters: [{
			name: "arg0_key",
			type: "string"
		}, {
			name: "arg1_value",
			type: "string"
		}],
		output_type: "string",
		special_function: function (arg0_key, arg1_value) {
			//Convert from parameters
			let key = arg0_key;
			let value = arg1_value;
			
			//Declare local instance variables
			this.main.variables[key] = value;
			
			//Return statement
			return {
				display_value: `${key}: ${value}`,
				value: value
			};
		}
	},
	set_array: {
		name: "Set Array",
		category: "Variables",
		input_parameters: [{
			name: "arg0_key",
			type: "string"
		}, {
			name: "arg1_value",
			type: "string"
		}],
		output_type: "any[]",
		special_function: function (arg0_key, arg1_value) {
			//Convert from parameters
			let key = arg0_key;
			let value = arg1_value;
			
			//Declare local instance variables
			this.main.variables[key] = value.split(",");
			let local_value = this.main.variables[key];
			
			//Return statement
			return {
				display_value: `${key}: ${local_value.length} Elements`,
				value: this.main.variables[key]
			};
		}
	},
	set_null: {
		name: "Set Null",
		category: "Variables",
		input_parameters: [{
			name: "arg0_key",
			type: "string"
		}],
		output_type: "any",
		special_function: function (arg0_key) {
			//Convert from parameters
			let key = arg0_key;
			
			//Declare local instance variables
			this.main.variables[key] = null;
			
			//Return statement
			return {
				display_value: `${key}: null`,
				value: this.main.variables[key]
			};
		}
	},
	set_object: {
		name: "Set Object",
		category: "Variables",
		input_parameters:	[{
			name: "arg0_key",
			type: "any"
		}, {
			name: "arg1_value",
			type: "string"
		}],
		output_type: "any",
		special_function: function (arg0_key, arg1_value) {
			//Convert from parameters
			let key = arg0_key;
			let value = arg1_value;
			
			//Declare local instance variables
			this.main.variables[key] = (typeof value === "string") ?
				JSON.parse(value) : value;
			
			//Return statement
			return {
				display_value: `${key}: ${value}`,
				value: this.main.variables[key]
			};
		}
	},
	
	//Variables (Get)
	get_any: {
		name: "Get Any",
		...ve.NodeEditor.Forse.variables_get_obj,
		output_type: "any"
	},
	get_string_array: {
		name: "Get String Array",
		...ve.NodeEditor.Forse.variables_get_obj,
		output_type: "string[]"
	},
	get_number_array: {
		name: "Get Number Array",
		...ve.NodeEditor.Forse.variables_get_obj,
		output_type: "number[]"
	},
	get_boolean: {
		name: "Get Boolean",
		...ve.NodeEditor.Forse.variables_get_obj,
		output_type: "boolean"
	},
	get_number: {
		name: "Get Number",
		...ve.NodeEditor.Forse.variables_get_obj,
		output_type: "number"
	},
	get_string: {
		name: "Get String",
		...ve.NodeEditor.Forse.variables_get_obj,
		output_type: "string"
	},
	get_array: {
		name: "Get Array",
		...ve.NodeEditor.Forse.variables_get_obj,
		output_type: "any[]"
	},
	get_null: {
		name: "Get Null",
		...ve.NodeEditor.Forse.variables_get_obj,
		output_type: "any"
	},
	get_object: {
		name: "Get Object",
		...ve.NodeEditor.Forse.variables_get_obj,
		output_type: "any"
	},
	get_global: {
		name: "Get Global",
		category: "Variables",
		input_parameters: [{
			name: "arg0_key",
			type: "string"
		}],
		output_type: "any",
		special_function: function (arg0_key) {
			//Convert from parameters
			let key = arg0_key;
			
			//Declare local instance variables
			let obj_value = Object.getValue(global, key);
			
			//Return statement
			return {
				display_value: `${key}: ${obj_value}`,
				value: obj_value
			};
		}
	},
};