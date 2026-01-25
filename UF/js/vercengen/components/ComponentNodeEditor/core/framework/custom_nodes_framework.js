//Initialise methods
{
	/**
	 * Generates logic for custom nodes.
	 * @private
	 */
	ve.NodeEditor.prototype._createCustomExecutionLogic = function (subgraph) {
		//Convert from parameters
		let parent_options = this.options;
		
		//Return statement
		return async function (...args) {
			let sub_editor = new ve.NodeEditor(subgraph, {
				...parent_options,
				headless: true,
				show_internal: true,
			});
			
			let sub_inputs = sub_editor.main.nodes.filter(
				(n) => n.value.key === "ve_input",
			);
			sub_inputs.sort((a, b) => a.value.coords.y - b.value.coords.y);
			
			for (let i = 0; i < sub_inputs.length; i++) {
				if (args[i] !== undefined) {
					sub_inputs[i].runtime_value = args[i];
				}
			}
			
			let results = await sub_editor.run(false);
			let sub_output = sub_editor.main.nodes.find(
				(n) => n.value.key === "ve_output",
			);
			let return_val = sub_output ? results[sub_output.id] : undefined;
			
			sub_editor.clear();
			return {value: return_val};
		}
	};
	
	/**
	 * Deletes a custom node definition.
	 * @private
	 */
	ve.NodeEditor.prototype._deleteCustomNode = function (arg0_key) {
		let key = arg0_key;
		
		if (this.main.custom_node_types[key]) {
			delete this.main.custom_node_types[key];
			delete this.options.node_types[key];
			
			if (this.toolbox_window) {
				this.toolbox_window.close();
				this.drawToolbox();
			}
			
			veToast("Custom Node Deleted.");
		}
	};
}