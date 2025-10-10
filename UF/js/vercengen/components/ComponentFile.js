ve.File = class veFile extends ve.Component {
	static demo_value = "./README.md";
	
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = arg0_value;
		let options = (arg1_options) ? arg1_options : {};
		super(options);
		
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-file");
			this.element.instance = this;
		HTML.applyCSSStyle(this.element, options.style);
		
		this.value = value;
		
		//Format HTML string
		let folder_string = (options.is_folder) ? `webkitdirectory directory ` : "";
		let multifile_string = (options.is_multifile) ? `multiple ` : "";
		
		let html_string = [];
		html_string.push(`<span id = "name"></span> `);
		if (!options.is_save) {
			html_string.push(`<input type = "file" ${HTML.objectToAttributes(options.attributes)} ${folder_string}${multifile_string}>`);
		} else {
			html_string.push(`<button id = "confirm-file">${(options.label) ? options.label : "Confirm File"}</button>`);
		}
		
		//Populate element and initialise handlers
		this.element.innerHTML = html_string.join("");
		this.v = this.value;
	}
	
	get name () {
		//Return statement
		return this.element.querySelector(`#name`).innerHTML;
	}
	
	set name (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
		
		//Set name
		this.element.querySelector(`#name`).innerHTML = (value) ? value : "";
	}
	
	get v () {
		//Declare local instance variables
		let file_el = this.element.querySelector(`input[type="file"]`);
		
		//Return statement
		if (file_el) return file_el.value;
		return this.element.querySelector(`button[id="confirm-file"]`).value;
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
		
		//Declare local instance variables
		let file_input_el = this.element.querySelector(`input[type="file"]`);
		let save_file_el = this.element.querySelector(`button[id="confirm-file"]`);
		
		if (file_input_el) {
			file_input_el.setAttribute("value", value);
		} else if (save_file_el) {
			save_file_el.setAttribute("value", value);
		}
		if (this.options.onchange) this.options.onchange(this.value);
	}
	
	remove () {
		this.element.remove();
	}
};