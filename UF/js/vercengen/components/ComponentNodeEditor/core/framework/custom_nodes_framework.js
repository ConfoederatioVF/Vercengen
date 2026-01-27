//Initialise methods
{
	/**
	 * Generates logic for custom nodes.
	 * 
	 * @param {Object} arg0_subgraph
	 * 
	 * @private
	 */
	ve.NodeEditor.prototype._createCustomExecutionLogic = function (arg0_subgraph) {
		//Convert from parameters
		let subgraph = arg0_subgraph;
		
		//Return statement
		return async function (...args) {
			let sub_editor = new ve.NodeEditor(subgraph, {
				...this.options,
				headless: true,
				show_internal: true,
			});
			let subinputs = sub_editor.main.nodes.filter((n) => n.value.key === "ve_input");
				subinputs.sort((a, b) => a.value.coords.y - b.value.coords.y);
			
			//Iterate over all subinputs and fetch their runtime value
			for (let i = 0; i < subinputs.length; i++)
				if (args[i] !== undefined) subinputs[i].runtime_value = args[i];
			
			let results = await sub_editor.run(false);
			let sub_output = sub_editor.main.nodes.find((n) => n.value.key === "ve_output");
			
			let return_value = sub_output ? results[sub_output.id] : undefined;
			
			sub_editor.clear();
			
			//Return statement
			return { value: return_value };
		}
	};
	
	/**
	 * Deletes a custom node definition.
	 * 
	 * @param {string} arg0_key
	 * 
	 * @private
	 */
	ve.NodeEditor.prototype._deleteCustomNode = function (arg0_key) {
		//Convert from parameters
		let key = arg0_key;
		
		//Handle deleting custom nodes
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