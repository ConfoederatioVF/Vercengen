global.ScriptManager = class extends ve.Class {
	constructor () {
		super();
		
		this.script_manager = new ve.ScriptManager(undefined, { binding: "this.value" });
		super.open("instance", { name: "ScriptManager", width: "30rem" });
	}
}

setTimeout(() => {
	global.node_window = veWindow(veNodeEditor(), {
		can_rename: false,
		name: "Node Editor",
		width: "50vw"
	});
}, 500);