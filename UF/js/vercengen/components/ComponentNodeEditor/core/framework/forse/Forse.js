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
				}
			},
			
			node_types: {
				...ve.NodeEditor.Forse.conditionals,
				...ve.NodeEditor.Forse.functions,
				...ve.NodeEditor.Forse.loops,
				...ve.NodeEditor.Forse.variables,
				...ve.NodeEditor.Forse.variables_casting,
				...ve.NodeEditor.Forse.variables_expression
			}
		};
	}
};