ve.NodeEditor.Forse.variables_casting = {
	//Variables (Convert)
	convert_to_any: {
		name: "Convert to Any",
		category: "Variables (Casting)",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}],
		output_type: "any",
		special_function: function (arg0_variable) {
			//Return statement
			return {
				display_value: `Type: any`,
				value: this.main.variables[arg0_variable]
			};
		}
	},
	convert_to_array: {
		name: "Convert to String Array",
		category: "Variables (Casting)",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}],
		output_type: "any[]",
		special_function: function (arg0_variable) {
			//Convert from parameters
			let local_value =  this.main.variables[arg0_variable];
			
			//Convert to array if not already an array
			if (!Array.isArray(local_value)) local_value = Array.toArray(local_value);
			
			//Return statement
			return {
				display_value: `any[${local_value.length}]`,
				value: local_value
			};
		}
	},
	convert_to_string_array: {
		name: "Convert to String Array",
		category: "Variables (Casting)",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}],
		output_type: "string[]",
		special_function: function (arg0_variable) {
			//Convert from parameters
			let local_value =  this.main.variables[arg0_variable];
			
			//Convert to array if not already an array
			if (!Array.isArray(local_value)) local_value = Array.toArray(local_value);
			for (let i = 0; i < local_value.length; i++)
				if (local_value[i].toString) {
					local_value[i] = local_value[i].toString();
				} else if (typeof local_value[i] !== "string") {
					try {
						local_value[i] = JSON.stringify(local_value[i]);
					} catch (e) {
						local_value[i] = `${local_value[i]}`;
					}
				}
			
			//Return statement
			return {
				display_value: `string[${local_value.length}]`,
				value: local_value
			};
		}
	},
	convert_to_number_array: {
		name: "Convert to Number Array",
		category: "Variables (Casting)",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}],
		output_type: "number[]",
		special_function: function (arg0_variable) {
			//Convert from parameters
			let local_value =  this.main.variables[arg0_variable];
			
			//Convert to array if not already an array
			if (!Array.isArray(local_value)) local_value = Array.toArray(local_value);
			for (let i = 0; i < local_value.length; i++)
				if (typeof local_value[i] !== "number")
					local_value[i] = parseFloat(local_value[i]);
			
			//Return statement
			return {
				display_value: `number[${local_value.length}]`,
				value: local_value
			};
		}
	},
	convert_to_boolean: {
		name: "Convert to Boolean",
		category: "Variables (Casting)",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}],
		output_type: "boolean",
		special_function: function (arg0_variable) {
			return {
				display_value: (arg0_variable) ? `boolean: true` : `boolean: false`,
				value: (arg0_variable) ? true : false
			};
		}
	},
	convert_to_number: {
		name: "Convert to Number",
		category: "Variables (Casting)",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}],
		output_type: "number",
		special_function: function (arg0_variable) {
			let casted_number = Math.returnSafeNumber(arg0_variable);
			
			return {
				display_value: casted_number,
				value: casted_number
			};
		}
	},
	convert_to_script: {
		name: "Convert to Script",
		category: "Variables (Casting)",
		input_parameters: [{
			name: "arg0_file_path",
			type: "string"
		}],
		output_type: "string",
		special_function: function (arg0_file_path) {
			return {
				display_value: arg0_file_path,
				value: arg0_file_path
			};
		}
	},
	convert_to_string: {
		name: "Convert to String",
		category: "Variables (Casting)",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}],
		output_type: "number",
		special_function: function (arg0_variable) {
			let local_value = arg0_variable;
			
			if (local_value.toString) {
				local_value = local_value.toString();
			} else if (typeof local_value !== "string") {
				try {
					local_value = JSON.stringify(local_value);
				} catch (e) {
					local_value = `${local_value}`;
				}
			}
			
			return {
				display_value: local_value,
				value: local_value
			};
		}
	},
};