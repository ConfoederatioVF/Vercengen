//Initialise functions
{
	ve.ScriptManager._drawFileExplorer = function (arg0_value, arg1_component_obj) {
		//Convert from parameters
		let value = arg0_value;
		let component_obj = arg1_component_obj;
		
		//Redraw file explorer first
		component_obj.refresh();
		
		//Detect file paths via data-path attribute and check against folder data to draw icons/classes
		let all_hierarchy_datatypes = component_obj.element.querySelectorAll(`[component="ve-hierarchy-datatype"][data-path]`);
		console.log(value, component_obj);
		
		for (let i = 0; i < all_hierarchy_datatypes.length; i++) {
			let local_instance_el = all_hierarchy_datatypes[i].instance.element;
			let local_path = local_instance_el.getAttribute("data-path");
			
			if (this.config?.files[local_path]) {
				let local_config_obj = this.config.files[local_path];
				
				//Set data attributes
				all_hierarchy_datatypes[i].setAttribute("data-mode", (local_config_obj.mode) ? local_config_obj.mode : "default");
			}
		}
	};
	
	ve.ScriptManager.loadConfig = function () {
		if (this._settings.project_folder === "none") return; //Internal guard clause if project folder is not set
		
		//Declare local instance variables
		let project_folder = this._settings.project_folder;
		
		//Parse config
		if (project_folder && fs.existsSync(path.join(project_folder, ".ve-sm")))
			this.config = JSON.parse(fs.readFileSync(project_folder, "utf8"));
		if (this.config) {
			ve.ScriptManager._drawFileExplorer.call(this, this.leftbar_file_explorer.v, this.leftbar_file_explorer);
			ve.ScriptManager._indexDocumentation.call(this, this.leftbar_status_el);
		}
	};
	
	ve.ScriptManager.saveConfig = function () {
		if (this._settings.project_folder === "none") return; //Internal guard clause if project folder is not set
		
		//Declare local instance variables
		let project_folder = this._settings.project_folder;
		
		//Save this.config to base project folder if possible
		fs.writeFileSync(path.join(project_folder, ".ve-sm"), JSON.stringify(this.config));
	};
}