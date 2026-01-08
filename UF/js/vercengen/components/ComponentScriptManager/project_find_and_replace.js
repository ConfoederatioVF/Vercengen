/**
 * Opens a global find and replace prompt across the current set project folder. If no project folder is set, it looks in the current leftbar file explorer.
 * - Method of: {@link ve.ScriptManager}
 * 
 * @private
 */
ve.ScriptManager.prototype._openFindAndReplace = function () {
	//Declare local instance variables
	let current_folder = (this._settings.project_folder !== "none") ? 
		this._settings.project_folder : this.leftbar_file_explorer.v;
	
	//Open this.find_and_replace_window
	if (this.find_and_replace_window) this.find_and_replace_window.close();
	this.find_and_replace_window = new ve.Window({
		
	}, {
		name: "Find and Replace",
		width: "30rem",
		
		can_rename: false
	});
};