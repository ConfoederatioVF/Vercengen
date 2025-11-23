global.ScriptManager = class extends ve.Class {
	constructor () {
		super();
		
		this.script_manager = new ve.ScriptManager();
		super.open("instance", { name: "ScriptManager", width: "30rem" });
	}
}

setTimeout(() => {
	global.script_manager = new ScriptManager();
}, 500);