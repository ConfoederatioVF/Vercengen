ve.BIUF = class veBIUF extends ve.Component {
	static demo_value = `<b>Bold</b> <i>Italic</i>, <u>Underline</u>, and regular text formatting are supported by BIUF fields.`;
	static demo_options = {
		onchange: (e) => {
			console.log(`ve.BIUF:`, e);
		}
	};
	
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : "";
		let options = (arg1_options) ? arg1_options : {};
			super(options);
		
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		
		//Declare local instance variables
		let attributes = {
			readonly: options.disabled,
			...options.attributes
		};
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-biuf");
			this.element.instance = this;
		this.options = options;
		HTML.applyTelestyle(this.element, options.style);
		
		this.value = value;
		
		//Format html_string
		let html_string = [];
		
		html_string.push(`<span id = "name"></span>`);
		html_string.push(`<div id = "biuf-toolbar" class = "biuf-toolbar">`);
			html_string.push(`<button id = "bold-button" class = "bold-icon"><icon>format_bold</icon></button>`);
			html_string.push(`<button id = "italic-button" class = "italic-icon"><icon>format_italic</icon></button>`);
			html_string.push(`<button id = "underline-button" class = "underline-icon"><icon>format_underline</icon></button>`);
			html_string.push(`<button id = "clear-button" class = "clear-icon"><icon>format_clear</icon></button>`);
		html_string.push(`</div>`);
		html_string.push(`<div id = "biuf-input" class = "biuf-input" contenteditable = "true" ${HTML.objectToAttributes(attributes)}></div>`);
		
		//Populate element and initialise handlers
		this.element.innerHTML = html_string.join("");
		this.element.querySelector(`#biuf-input`).addEventListener("input", (e) => {
			this.sendOnchangeEvent();
			this.handleBIUF(e.target);
		});
		this.initBIUFToolbar();
		super.name = options.name;
		this.v = this.value;
	}
	
	get v () {
		//Return statement
		return this.element.querySelector(`#biuf-input`).innerHTML;
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : "";
		if (value === undefined) return; //Internal guard clause if value is undefined
		
		//Set #biuf-input value
		this.element.querySelector(`#biuf-input`).innerHTML = value;
	}
	
	//Internal helper functions
	handleBIUF (arg0_biuf_el) {
		//Convert from parameters
		let biuf_el = arg0_biuf_el;
		
		//Declare local instance variables
		let child_el = biuf_el.firstChild;
		
		//Declare while loop, break when next sibling element can no longer be found.
		while (child_el) {
			let remove_node = null;
			
			//Check if child_el is not of <b><i><u> tags.
			if (child_el.tagName && (!["b", "i", "u"].includes(child_el.tagName.toLowerCase())))
				remove_node = child_el;
			child_el = child_el.nextSibling;
			
			//Remove node if flag is true
			if (remove_node)
				remove_node.parentNode.removeChild(remove_node);
		}
	}
	
	initBIUFToolbar () {
		//Declare local instance variables
		let toolbar_el = this.element.querySelector(`#biuf-toolbar`);
		
		//Declare element references
		let bold_button = toolbar_el.querySelector("#bold-button");
		let clear_button = toolbar_el.querySelector("#clear-button");
		let italic_button = toolbar_el.querySelector("#italic-button");
		let underline_button = toolbar_el.querySelector("#underline-button");
		
		//Show toolbar when text is selected
		toolbar_el.style.display = "none";
		document.addEventListener("mouseup", (e) => {
			let selection = window.getSelection();
			
			if (selection.toString() !== "" && this.element.querySelector(`#biuf-input:focus`)) {
				//var range = selection.getRangeAt(0);
				let rect = toolbar_el.getBoundingClientRect();
				
				toolbar_el.style.display = "table";
				toolbar_el.style.top = `-${toolbar_el.offsetHeight/2.5}px`;
			} else {
				toolbar_el.style.display = "none";
			}
		});
		
		//Apply formatting when various toolbar buttons are clicked
		bold_button.addEventListener("click", () => {
			document.execCommand("bold");
		});
		clear_button.addEventListener("click", () => {
			document.execCommand("removeFormat");
		});
		italic_button.addEventListener("click", () => {
			document.execCommand("italic");
		});
		underline_button.addEventListener("click", () => {
			document.execCommand("underline");
		});
	}
	
	sendOnchangeEvent () {
		this.value = this.v;
		this.fireToBinding();
	}
};