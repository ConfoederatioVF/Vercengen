ve.NodeEditor.Forse.loops = {
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
};