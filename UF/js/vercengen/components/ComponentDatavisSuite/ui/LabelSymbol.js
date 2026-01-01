/**
 * ##### Constructor;
 * - `arg0_value`: {@link Object}
 * - `arg1_options`: {@link Object}
 *   - `.name`; {@link string}
 * 
 * @type {ve.DatavisSuite.LabelSymbol}
 */
ve.DatavisSuite.LabelSymbol = class extends ve.Component {
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-datavis-suite-labels-symbol");
			this.element.instance = this;
			HTML.setAttributesObject(this.element, options.attributes);
			let io = {
				onuserchange: () => this.fireToBinding()
			};
		this.interface = new ve.Interface({
			text_options: new ve.Interface({
				
			}, { name: "Text Options" }),
			text_style: new ve.Interface({
				
			}, { name: "Text Style" }),
			shadow_options: new ve.Interface({
				shadow_enabled: new ve.Toggle(false, { name: "Shadow Enabled", ...io }),
				
				shadow_blur: new ve.Number(0, { name: "Shadow Blur", ...io }),
				shadow_offset_x: new ve.Number(0, { name: "Shadow Offset X", ...io }),
				shadow_offset_y: new ve.Number(0, { name: "Shadow Offset Y", ...io })
			}, { name: "Shadow" })
		}, { name: (options.name) ? options.name : "Label Symbol" });
	}
	
	get v () {
		
	}
	
	set v (arg0_value) {
		
	}
};