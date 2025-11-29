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
	global.table_window = veWindow({
		table: new ve.Table([[["Test","hello",1,7,"Row 1"],["","world",2,8,"Row 2"],["","this",3,9,"Row 3"],["","is",4,10,"Row 4"],["","a",5,11,"Row 5"],["","test",6,12,"Row 6"],["","",7,"",""]]], { dark_mode: true })
	});
}, 500);