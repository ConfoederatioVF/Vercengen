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
			return {
				display_value: `Run: global.${arg0_function_key}`,
				run: () => {
					try {
						return Object.getValue(global, arg0_function_key)(...arg1_arguments_array);
					} catch (e) { console.error(e); }
				}
			}
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
			let return_value;
			
			try {
				return_value = Object.getValue(global, arg0_function_key)(...arg1_arguments_array);
			} catch (e) { console.error(e); }
			
			return {
				display_value: `Run: global.${arg0_function_key}`,
				run: () => return_value,
				value: return_value
			}
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
		special_function: function (arg0_variable, arg1_method_key, arg2_arguments_array) {
			return {
				display_value:`Run Class Method: ${arg1_method_key}`,
				run: () => {
					try {
						return arg0_variable[arg1_method_key](...arg2_arguments_array);
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
		special_function: function (arg0_variable, arg1_method_key, arg2_arguments_array) {
			let return_value;
			
			try {
				return_value = arg0_variable[arg1_method_key](...arg2_arguments_array);
			} catch (e) { console.error(e); }
			
			return {
				display_value:`Run Class Method: ${arg1_method_key}`,
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
		special_function: function (arg0_variable, arg1_field_key) {
			return {
				display_value: `.${arg1_field_key}: ${arg0_variable[arg1_field_key]}`,
				value: arg0_variable[arg1_field_key]
			};
		}
	},
	set_class_field: {
		name: "Get Class Field",
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
		special_function: function (arg0_variable, arg1_field_key, arg2_value) {
			arg0_variable[arg1_field_key] = arg2_value;
			
			return {
				display_value: `.${arg1_field_key}: ${arg0_variable[arg1_field_key]}`,
				value: arg0_variable[arg1_field_key]
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
		special_function: function (arg0_variable) {
			console.error("[FORSE] [ERROR]", arg0_variable);
			
			//Return statement
			return {
				display_value: `Logged Error`,
				value: arg0_variable
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
		special_function: function (arg0_variable) {
			console.log("[FORSE] [INFO]", arg0_variable);
			
			//Return statement
			return {
				display_value: `Logged Info`,
				value: arg0_variable
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
		special_function: function (arg0_variable) {
			console.warn("[FORSE] [WARN]", arg0_variable);
			
			//Return statement
			return {
				display_value: `Logged Warning`,
				value: arg0_variable
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
		special_function: function (arg0_script) {
			let return_value;
			
			try {
				if (fs.existsSync(arg0_script)) {
					let script_value = fs.readFileSync(arg0_script, "utf8");
					return_value = eval(script_value);
				}
			} catch (e) {
				console.error(e);
			}
			
			return {
				display_value: `Run: ${path.basename(arg0_script)}`,
				run: () => return_value,
				value: return_value
			};
		}
	},
};