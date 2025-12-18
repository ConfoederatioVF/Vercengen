global.ScriptManager = class extends ve.Class {
	constructor () {
		super();
		
		this.script_manager = new ve.ScriptManager(undefined, { binding: "this.value" });
		super.open("instance", { name: "ScriptManager", width: "30rem" });
	}
}

setTimeout(() => {
	//global.script_manager = new ScriptManager();
	/*global.test_window = veWindow({
		number: veNumber([6, 8, 0]),
		text: veText(["hello", "world"])
	});*/
	global.node_window = veWindow(new ve.NodeEditor(undefined, {
		node_types: {
			add_numbers: {
				name: "Add Numbers",
				
				category: "Expressions",
				input_parameters: [{
					name: "arg0_number",
					type: "number"
				}, {
					name: "arg1_number",
					type: "number"
				}]
			},
			set_number: {
				name: "Set Number",
				
				category: "Expressions",
				input_parameters: [{
					name: "arg0_number",
					type: "number"
				}]
			}
		}
	}));
}, 500);