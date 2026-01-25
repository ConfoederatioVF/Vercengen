ve.NodeEditor.Forse = class {
	static getForseObject () {
		//Declare local instance variables
		let get_variable_obj = {
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
		
		//Return statement
		return {
			project_folder: "./settings/scripts/",
			category_types: {
				"Conditionals": {
					colour: "#7072e0",
					text_colour: [255, 255, 255]
				},
				"Functions": {
					colour: "#9ecd9e",
					text_colour: [0, 0, 0]
				},
				"Loops": {
					colour: "#d4ca60",
					text_colour: [0, 0, 0]
				},
				"Variables": {
					colour: "#d56a6a",
					text_colour: [0, 0, 0]
				},
				"Variables (Casting)": {
					colour: "#a82020",
					text_colour: [255, 255, 255]
				}
			},
			
			node_types: {
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
				
				//Loops (For loop, [WIP] - setInterval, setTimeout, Object.iterate (Get Iteration Key, Get Iteration Value))
				for_loop: {
					name: "For Loop",
					category: "Loops",
					input_parameters: [{
						name: "arg0_times",
						type: "number"
					}],
					output_type: "number",
					special_function: function (arg0_number) {
						//local_node (ve.NodeEditorDatatype) is always the final argument passed by run()
						let local_node = arguments[arguments.length - 1];
						let state_key = `${local_node.id}_current_index`;
						if (this.main.node_iterations[state_key] === undefined)
							this.main.node_iterations[state_key] = 0;
						
						let current_index = this.main.node_iterations[state_key]++;
						
						//Return statement
						return {
							display_value: `Iterate ${arg0_number}x`,
							iterations: arg0_number,
							value: current_index,
						};
					}
				},
				get_object_iteration_key: {
					name: "Get Obj.Iter. Key",
					category: "Loops",
					input_parameters: [{
						name: "arg0_object_iteration",
						type: "{key: string, value: any}"
					}],
					output_type: "string",
					special_function: function (arg0_object_iteration) {
						//Return statement
						return {
							display_value: `.${arg0_object_iteration.local_key}`,
							value: arg0_object_iteration.local_key
						};
					}
				},
				get_object_iteration_value: {
					name: "Get Obj.Iter. Value",
					category: "Loops",
					input_parameters: [{
						name: "arg0_object_iteration",
						type: "{key: string, value: any}"
					}],
					output_type: "any",
					special_function: function (arg0_object_iteration) {
						//Return statement
						return {
							display_value: `Iteration Value`,
							value: arg0_object_iteration.local_value
						};
					}
				},
				object_iterate: { //[WIP] - Refactor at a later date
					name: "Iterate over Object",
					category: "Loops",
					input_parameters: [{
						name: "arg0_object",
						type: "any",
					}],
					output_type: "{key: string, value: any}",
					special_function: function (arg0_object) {
						//Convert from parameters
						let object = (typeof arg0_object === "object" && arg0_object !== null) ? 
							arg0_object : {};
						
						//Declare local instance variables
						let entries = Object.entries(object);
						let iteration_count = entries.length;
						let local_node = arguments[arguments.length - 1];
						
						//Track state for the current iteration index
						let state_key = `${local_node.id}_current_index`;
						if (this.main.node_iterations[state_key] === undefined)
							this.main.node_iterations[state_key] = 0;
						
						let current_index = this.main.node_iterations[state_key]++;
						
						//Safely get the key and value for the current index
						let current_entry = entries[current_index] || [null, null];
						let [key, value] = current_entry;
						
						//Return statement
						return {
							display_value: key !== null ? `Key: ${key}` : "Empty Object",
							iterations: iteration_count,
							value: { local_key: key, local_value: value }
						};
					},
				},
				set_timeout: {
					name: "Set Timeout",
					category: "Loops",
					input_parameters: [{
						name: "arg0_timeout",
						type: "number"
					}, {
						name: "arg1_value",
						type: "any"
					}],
					output_type: "any",
					special_function: async function (arg0_number, arg1_value) {
						let delay_time = Math.returnSafeNumber(arg0_number);
						
						await new Promise((resolve) => setTimeout(resolve, delay_time));
						
						//Return statement
						return {
							display_value: `Wait ${delay_time}ms`,
							value: arg1_value
						};
					}
				},
				
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
					...get_variable_obj,
					output_type: "any"
				},
				get_string_array: {
					name: "Get String Array",
					...get_variable_obj,
					output_type: "string[]"
				},
				get_number_array: {
					name: "Get Number Array",
					...get_variable_obj,
					output_type: "number[]"
				},
				get_boolean: {
					name: "Get Boolean",
					...get_variable_obj,
					output_type: "boolean"
				},
				get_number: {
					name: "Get Number",
					...get_variable_obj,
					output_type: "number"
				},
				get_string: {
					name: "Get String",
					...get_variable_obj,
					output_type: "string"
				},
				get_array: {
					name: "Get Array",
					...get_variable_obj,
					output_type: "any[]"
				},
				get_null: {
					name: "Get Null",
					...get_variable_obj,
					output_type: "any"
				},
				get_object: {
					name: "Get Object",
					...get_variable_obj,
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
				}
			}
		};
	}
};