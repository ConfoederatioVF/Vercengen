/**
 * Internal DSL of <span color="yellow">{@link ve.NodeEditor}</span>.
 * 
 * ##### Static Methods:
 * - <span color=00ffff>{@link ve.NodeEditor.Forse.getForseCustomNodesObject|getForseCustomNodesObject}</span>() | {@link Object}
 * - <span color=00ffff>{@link ve.NodeEditor.Forse.getForseObject|getForseObject}</span>(arg0_options:{@link Object}) | {@link Object}
 * 
 * @memberof ve.Component.ve.NodeEditor
 * @type {ve.NodeEditor.Forse}
 */
ve.NodeEditor.Forse = class {
	/**
	 * Returns custom nodes from Forse that are needed for recursion.
	 * - Static method of: {@link ve.NodeEditor.Forse}
	 * 
	 * @alias ve.Component.ve.NodeEditor.Forse.getForseCustomNodesObject
	 * 
	 * @returns {Object}
	 */
	static getForseCustomNodesObject () {
		//Return statement
		return {
			category_types: {
				"Config": {
					colour: [70, 70, 90],
					text_colour: [200, 200, 255],
				},
				"Custom": {
					colour: [100, 50, 150],
					text_colour: [255, 255, 255],
				},
				"Parameters": {
					colour: [50, 50, 50],
					text_colour: [255, 255, 255],
				}
			},
			node_types: {
				ve_config_category: {
					name: "Node Category",
					category: "Config",
					input_parameters: [{ name: "Category", type: "string" }],
					is_internal: true,
					output_type: "string",
					special_function: (val) => {
						return { value: val };
					},
				},
				ve_config_name: {
					name: "Node Name",
					category: "Config",
					input_parameters: [{ name: "Name", type: "string" }],
					is_internal: true,
					output_type: "string",
					special_function: (val) => {
						return { value: val };
					},
				},
				ve_config_output_type: {
					name: "Node Output Type",
					category: "Config",
					input_parameters: [{ name: "Type", type: "string" }],
					is_internal: true,
					output_type: "string",
					special_function: (val) => {
						return { value: val };
					},
				},
				ve_input: {
					name: "Input (Parameter)",
					category: "Parameters",
					input_parameters: [
						{ name: "Name", type: "string" },
						{ name: "Type", type: "string" },
					],
					is_internal: true,
					output_type: "any",
					special_function: function (p_name, p_type, context_node) {
						return {
							value: context_node ? context_node.runtime_value : undefined,
						};
					},
				},
				ve_output: {
					name: "Output (Return)",
					category: "Parameters",
					input_parameters: [{ name: "Result", type: "any" }],
					is_internal: true,
					output_type: "any",
					special_function: (arg) => {
						return { value: arg };
					},
				},
				ve_comment: {
					name: "Comment",
					category: "Config",
					input_parameters: [],
					options: { is_comment: true },
					output_type: "none",
				}
			}
		};
	}
	
	/**
	 * Returns the configured DSL for the given {@link ve.NodeEditor} instance.
	 * - Static method of: {@link ve.NodeEditor.Forse}
	 * 
	 * @alias ve.Component.ve.NodeEditor.Forse.getForseObject
	 * 
	 * @param {Object} [arg0_options]
	 *  @param {boolean} [arg0_options.disable_custom_nodes=false] - Whether to disable custom nodes creation.
	 *  @param {boolean} [arg0_options.disable_forse=false] - Whether to disable Forse itself.
	 * 
	 * @returns {Object}
	 */
	static getForseObject (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Declare local instance variables
		let custom_nodes_obj = (!options.disable_custom_nodes) ? 
			ve.NodeEditor.Forse.getForseCustomNodesObject() : {};
		if (options.disable_forse && !options.disable_custom_nodes)
			return custom_nodes_obj; //Internal guard clause if only custom nodes are enabled
		
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
					colour: "#eaaf6c",
					text_colour: [0, 0, 0]
				},
				"Variables (Casting)": {
					colour: "#d56a6a",
					text_colour: [0, 0, 0]
				},
				"Variables (Expressions)": {
					colour: "#a82020",
					text_colour: [255, 255, 255]
				},
				
				...custom_nodes_obj.category_types
			},
			
			node_types: {
				...ve.NodeEditor.Forse.conditionals,
				...ve.NodeEditor.Forse.functions,
				...ve.NodeEditor.Forse.loops,
				...ve.NodeEditor.Forse.variables,
				...ve.NodeEditor.Forse.variables_casting,
				...ve.NodeEditor.Forse.variables_expression,
				
				...custom_nodes_obj.node_types
			}
		};
	}
};