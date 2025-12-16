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
			set_number: new ve.NodeEditorDatatype({
				input_parameters: ["number", "number"]
			})
		}
	}));
}, 500);