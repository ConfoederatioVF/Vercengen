ve.NodeEditor.Forse.functions = {
	//Functions
	call_function: {
		name: "Call Function",
		category: "Functions",
		input_parameters: [{
			name: "arg0_function_key",
			type: "string"
		}, {
			name: "arg1_arguments_array",
			type: "any[]"
		}],
		output_type: "any",
		special_function: (arg0_function_key, arg1_arguments_array) => {
			//Convert from parameters
			let function_key = arg0_function_key;
			let arguments_array = arg1_arguments_array;
			
			//Return statement
			return {
				display_value: `Run: global.${function_key}`,
				run: () => {
					try {
						return Object.getValue(global, function_key)(...arguments_array);
					} catch (e) { console.error(e); }
				}
			};
		}
	},
	call_function_in_preview: {
		name: "Call Function (Preview)",
		category: "Functions",
		input_parameters: [{
			name: "arg0_function_key",
			type: "string"
		}, {
			name: "arg1_arguments_array",
			type: "any[]"
		}],
		output_type: "any",
		special_function: (arg0_function_key, arg1_arguments_array) => {
			//Convert from parameters
			let function_key = arg0_function_key;
			let arguments_array = arg1_arguments_array;
			
			//Declare local instance variables
			let return_value;
				try {
					return_value = Object.getValue(global, function_key)(...arguments_array);
				} catch (e) { console.error(e); }
			
			//Return statement
			return {
				display_value: `Run: global.${function_key}`,
				run: () => return_value,
				value: return_value
			};
		}
	},
	
	//Functions (Class)
	call_class_method: {
		name: "Call Method",
		category: "Functions",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}, {
			name: "arg1_method_key",
			type: "string"
		}, {
			name: "arg2_arguments_array",
			type: "any[]"
		}],
		output_type: "any",
		special_function: (arg0_variable, arg1_method_key, arg2_arguments_array) => {
			//Convert from parameters
			let variable = arg0_variable;
			let method_key = arg1_method_key;
			let arguments_array = arg2_arguments_array;
			
			//Return statement
			return {
				display_value:`Run Class Method: ${method_key}`,
				run: () => {
					try {
						return variable[method_key](...arguments_array);
					} catch (e) { console.error(e); }
				},
			};
		}
	},
	call_class_method_in_preview: {
		name: "Call Method (Preview)",
		category: "Functions",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}, {
			name: "arg1_method_key",
			type: "string"
		}, {
			name: "arg2_arguments_array",
			type: "any[]"
		}],
		output_type: "any",
		special_function: (arg0_variable, arg1_method_key, arg2_arguments_array) => {
			//Convert from parameters
			let variable = arg0_variable;
			let method_key = arg1_method_key;
			let arguments_array = arg2_arguments_array;
			
			//Declare local instance variables
			let return_value;
			try {
				return_value = variable[method_key](...arguments_array);
			} catch (e) { console.error(e); }
			
			//Return statement
			return {
				display_value:`Run Class Method: ${method_key}`,
				run: () => return_value,
				value: return_value
			};
		}
	},
	get_class_field: {
		name: "Get Class Field",
		category: "Functions",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}, {
			name: "arg1_field_key",
			type: "string"
		}],
		output_type: "any",
		special_function: (arg0_variable, arg1_field_key) => {
			//Convert from parameters
			let variable = arg0_variable;
			let field_key = arg1_field_key;
			
			//Return statement
			return {
				display_value: `.${field_key}: ${variable[field_key]}`,
				value: variable[field_key]
			};
		}
	},
	set_class_field: {
		name: "Set Class Field",
		category: "Functions",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}, {
			name: "arg1_field_key",
			type: "string"
		}, {
			name: "arg2_value",
			type: "any"
		}],
		output_type: "any",
		special_function: (arg0_variable, arg1_field_key, arg2_value) => {
			//Convert from parameters
			let variable = arg0_variable;
			let field_key = arg1_field_key;
			let value = arg2_value;
			
			variable[field_key] = value;
			
			//Return statement
			return {
				display_value: `.${field_key}: ${variable[field_key]}`,
				value: variable[field_key]
			};
		}
	},
	
	//Functions (Expressions)
	log_error: {
		name: "(Log) ERROR",
		
		category: "Functions",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}],
		output_type: "any",
		special_function: (arg0_variable) => {
			//Convert from parameters
			let variable = arg0_variable;
			
			console.error("[FORSE] [ERROR]", variable);
			
			//Return statement
			return {
				display_value: `Logged Error`,
				value: variable
			};
		}
	},
	log_info: {
		name: "(Log) INFO",
		
		category: "Functions",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}],
		output_type: "any",
		special_function: (arg0_variable) => {
			//Convert from parameters
			let variable = arg0_variable;
			
			console.log("[FORSE] [INFO]", variable);
			
			//Return statement
			return {
				display_value: `Logged Info`,
				value: variable
			};
		}
	},
	log_warn: {
		name: "(Log) WARN",
		
		category: "Functions",
		input_parameters: [{
			name: "arg0_variable",
			type: "any"
		}],
		output_type: "any",
		special_function: (arg0_variable) => {
			//Convert from parameters
			let variable = arg0_variable;
			
			console.warn("[FORSE] [WARN]", variable);
			
			//Return statement
			return {
				display_value: `Logged Warning`,
				value: variable
			};
		}
	},
	run_script: {
		name: "Run Script",
		
		category: "Functions",
		input_parameters: [{
			name: "arg0_script",
			type: "script"
		}],
		output_type: "any",
		special_function: (arg0_script) => {
			//Convert from parameters
			let script = arg0_script;
			
			//Declare local instance variables
			let return_value;
			
			//Run script
			try {
				if (fs.existsSync(script)) {
					let script_value = fs.readFileSync(script, "utf8");
					return_value = eval(script_value);
				}
			} catch (e) { console.error(e); }
			
			//Return statement
			return {
				display_value: `Run: ${path.basename(script)}`,
				run: () => return_value,
				value: return_value
			};
		}
	},
};