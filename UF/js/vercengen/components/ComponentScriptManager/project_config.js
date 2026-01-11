//Initialise functions
{
	ve.ScriptManager._drawFileExplorer = function (arg0_value, arg1_component_obj) {
		//Convert from parameters
		let value = arg0_value;
		let component_obj = arg1_component_obj;
		
		//Detect file paths via data-path attribute and check against folder data
	};
	
	ve.ScriptManager.loadConfig = function () {
		if (this._settings.project_folder === "none") return; //Internal guard clause if project folder is not set
		
		//Declare local instance variables
		let project_folder = this._settings.project_folder;
		
		//Parse config
		if (project_folder && fs.existsSync(path.join(project_folder, ".ve-sm")))
			this.config = JSON.parse(fs.readFileSync(project_folder, "utf8"));
		if (this.config) {
			
		}
	};
	
	ve.ScriptManager.saveConfig = function () {
		
	};
}