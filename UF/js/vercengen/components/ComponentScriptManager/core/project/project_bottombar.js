/**
 * ##### Constructor:
 * - `arg0_value`: {@link Array}<{@link string}> - The array of currently opened file paths.
 * - `arg1_options`: {@link Object}
 *   - `.script_manager`: {@link ve.ScriptManager}
 */
ve.ScriptManager.UI_Bottombar = class extends ve.Component {
  constructor (arg0_value, arg1_options) {
    //Convert from parameters
    let value = (arg0_value) ? arg0_value : [];
    let options = (arg1_options) ? arg1_options : {};
      super(options);
    
    //Initialise options
    if (!options.file_paths) options.file_paths = [];
    
    //Declare local instance variables
    this.element = document.createElement("div");
      this.element.id = "ui-bottombar";
      this.element.instance = this;
    this.options = options;
    this.value = options.file_paths;

    this.from_binding_fire_silently = true;
    this.v = value;
    delete this.from_binding_fire_silently;
  }

  get v () {
    //Return statement
    return this.value;
  }

  set v (arg0_value) {
    //Convert from parameters
    let value = (arg0_value) ? arg0_value : [];
    if (value.length === 0) { 
      this.element.innerHTML = "";
      return;
    }

    //Declare local instance variables
    let components_array = [];

    //Iterate over all value file_paths; create button per file
    for (let i = 0; i < value.length; i++) {
      value[i] = path.resolve(value[i]);
      
      let local_el = document.createElement("button");
        local_el.id = value[i];
        local_el.setAttribute("data-file-path", value[i]);
        local_el.innerHTML = path.basename(value[i]);
        
        //Load file upon click
        local_el.addEventListener("click", (e) => {
          if (this.options.script_manager)
            if (this.options.script_manager._file_path !== value[i])
              this.options.script_manager.loadFile(value[i]);
        });
      let local_html_obj = new ve.HTML(local_el, {
        attributes: {
          [`data-file-extension-${path.extname(value[i])}`]: true
        }
      });
        local_html_obj._name = value[i];

      //Push local_html_obj to components_array
      components_array.push(local_html_obj);
    }

    this.list_obj = new ve.List(components_array, {
      do_not_allow_insertion: true,
      do_not_display_info_button: true,
      style: {
        "#component-body": { display: "flex" }
      }
    });
    this.search_select_obj = new ve.SearchSelect({
      list_obj: this.list_obj
    }, {
      search_select_els: () => this.list_obj.element.querySelectorAll(`[component="ve-html"]`),
      search_keys: ["_name"],
      style: {
        alignItems: "baseline",
        display: "flex"
      }
    });

    //Refresh this.element
    this.value = value;
    
    this.element.innerHTML = "";
    this.search_select_obj.bind(this.element);
    this.draw();
    this.fireFromBinding();
  }
  
  addFile (arg0_file_path) {
    //Convert from parameters
    let file_path = (arg0_file_path) ? path.resolve(arg0_file_path) : "";
    
    //Declare local instance variables
    if (this.value.length === 0) {
      this.v = [file_path];
    } else {
      let actual_value = [];
      
      //Iterate over this.list_obj.v; make sure file path is unique
      for (let i = 0; i < this.list_obj.v.length; i++) {
        let local_el = this.list_obj.v[i].element.querySelector("button[data-file-path]");
        
        actual_value.push(local_el.getAttribute("data-file-path"));
      }
      if (!actual_value.includes(file_path))
        actual_value.push(file_path);
      
      this.v = actual_value;
    }
  }
  
  draw () {
    for (let i = 0; i < this.list_obj.v.length; i++) {
      let local_el = this.list_obj.v[i].element.querySelector("button[data-file-path]");
      
      if (local_el.getAttribute("data-file-path") === this.options.script_manager._file_path) {
        local_el.setAttribute("data-is-selected", "true");
      } else {
        local_el.removeAttribute("data-is-selected");
      }
    }
  }
};