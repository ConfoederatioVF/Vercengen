ve.NodeEditor.Forse = class {
	static getForseObject () {
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
					colour: "#e0d122",
					text_colour: [0, 0, 0]
				},
				"Variables": {
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
				
				//Functions (Expressions)
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
				
				//Loops (For loop, setInterval, setTimeout, Object.iterate (Get Iteration Key, Get Iteration Value))
				repeat: {
					name: "Repeat",
					input_parameters: [{
						name: "arg0_times",
						type: "number"
					}],
					output_type: "number",
					special_function: function (arg0_number) {
						// The local_node (ve.NodeEditorDatatype) is always the final argument passed by run()
						const local_node = arguments[arguments.length - 1];
						// The first input parameter (arg0_times)
						const arg0_times = arguments[0];
						
						// Use this.main.node_iterations to store a counter for this specific node
						// This object is cleared every time run() is called, ensuring the index resets
						const state_key = `${local_node.id}_current_index`;
						if (this.main.node_iterations[state_key] === undefined) {
							this.main.node_iterations[state_key] = 0;
						}
						
						const current_index = this.main.node_iterations[state_key]++;
						
						return {
							//display_value: `Iterate ${arg0_number}x`,
							iterations: arg0_times,
							value: current_index,
						};
					}
				}
				
				//Variables
				
			}
		};
	}
};