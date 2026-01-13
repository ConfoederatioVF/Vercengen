//Initialise functions
{
	ve.ScriptManager._autosave = function () {
		if (!this._settings.manual_synchronisation || !this._file_path) return; //Internal guard clause if manual synchronisation is not turned on
		
		//Save to current file if possible
		fs.writeFileSync(this._file_path, this.v, "utf8");
	};
	
	ve.ScriptManager._synchroniseViews = function (arg0_synchronsing_from) {
		//Convert from parameters
		let synchronising_from = (arg0_synchronsing_from) ? arg0_synchronsing_from : "monaco";
		
		if (!this._settings.manual_synchronisation) return;
		
		//Open new confirm prompt if not already open
		if (this.synchronise_confirm_window) this.synchronise_confirm_window.close();
		this.synchronise_confirm_window = new ve.Confirm(`Are you sure you wish to synchronise ${(synchronising_from === "monaco") ? "Blockly" : "Monaco"} to ${(synchronising_from === "monaco") ? "Monaco" : "Blockly"}?`, {
			special_function: () => {
				if (synchronising_from === "blockly") {
					this.scene_blockly._exportToMonaco(true);
					delete this._blockly_change;
				} else if (synchronising_from === "monaco") {
					this.scene_monaco._exportToBlockly(true);
					delete this._monaco_change;
				}
			}
		});
	};
}