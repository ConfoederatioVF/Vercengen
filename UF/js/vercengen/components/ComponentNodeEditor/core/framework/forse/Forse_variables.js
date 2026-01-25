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
			this.main.variables[arg0_key] = arg1_value;
			
			return {
				display_value: `${arg0_key}: ${arg1_value}`,
				value: arg1_value
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
			this.main.variables[arg0_key] = arg1_value.split(",");
			let local_value = this.main.variables[arg0_key];
			
			//Iterate over all local_value elements and cast to string
			for (let i = 0; i < local_value.length; i++)
				if (local_value[i].toString)
					local_value[i] = local_value[i].toString();
			
			return {
				display_value: `${arg0_key}: ${local_value.length} Elements`,
				value: this.main.variables[arg0_key]
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
			this.main.variables[arg0_key] = arg1_value.split(",").map(parseFloat);
			let local_value = this.main.variables[arg0_key];
			
			return {
				display_value: `${arg0_key}: ${local_value.length} Elements`,
				value: this.main.variables[arg0_key]
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
			this.main.variables[arg0_key] = arg1_value;
			
			return {
				display_value: (arg1_value) ? `${arg0_key}: True` : `${arg0_key}: False`,
				value: arg1_value
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
			this.main.variables[arg0_key] = arg1_value;
			
			return {
				display_value: `${arg0_key}: ${arg1_value}`,
				value: arg1_value
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
			this.main.variables[arg0_key] = arg1_value;
			
			return {
				display_value: `${arg0_key}: ${arg1_value}`,
				value: arg1_value
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
			this.main.variables[arg0_key] = arg1_value.split(",");
			let local_value = this.main.variables[arg0_key];
			
			return {
				display_value: `${arg0_key}: ${local_value.length} Elements`,
				value: this.main.variables[arg0_key]
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
			this.main.variables[arg0_key] = null;
			
			return {
				display_value: `${arg0_key}: null`,
				value: this.main.variables[arg0_key]
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
			this.main.variables[arg0_key] = (typeof arg1_value === "string") ?
				JSON.parse(arg1_value) : arg1_value;
			
			return {
				display_value: `${arg0_key}: ${arg1_value}`,
				value: this.main.variables[arg0_key]
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
			//Return statement
			return {
				display_value: `${arg0_key}: ${this.main.variables[arg0_key]}`,
				value: this.main.variables[arg0_key]
			};
		}
	},
};