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
	global.datavis_suite = veWindow(new ve.DatavisSuite(), { 
		name: "DatavisSuite", 
		can_rename: false,
		
		height: "50vh",
		width: "50vw",
	});
}, 500);