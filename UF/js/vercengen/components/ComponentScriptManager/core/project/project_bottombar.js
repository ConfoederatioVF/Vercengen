/**
 * ##### Constructor:
 * - `arg0_value`: {@link Array}<{@link string}> - The array of currently opened file paths.
 * - `arg1_options`: {@link Object}
 *   - `.script_manager`: {@link ve.ScriptManager}
 */
ve.ScriptManager.UI_Bottombar = class {
    constructor (arg1_options) {
      //Convert from parameters
      let options = (arg1_options) ? arg1_options : {};
      
      //Initialise options
      if (!options.file_paths) options.file_paths = [];
      
      //Declare local instance variables
      this.options = options;
      this.value = options.file_paths;
    }

    get v () {
      //Return statement
      return this.value;
    }

    set v (arg0_value) {
      //Convert from parameters
      let value = (arg0_value) ? arg0_value : [];

      //Declare local instance variables
      let components_array = [];

      //Iterate over all value file_paths
      for (let i = 0; i < value.length; i++) {
        let local_el = document.createElement("div");
          local_el.id = value[i];
          local_el.setAttribute("data-file-extension", path.extname(value[i]));

        //Push local_el to components_array
        components_array.push(new ve.HTML(local_el, {
          name: value[i]
        }));
      }
    }
};