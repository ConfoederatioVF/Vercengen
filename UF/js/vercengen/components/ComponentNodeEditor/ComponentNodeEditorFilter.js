/**
 * Refer to <span color = "yellow">{@link ve.Component}</span> for methods or fields inherited from this Component's parent such as `.options.attributes` or `.element`.
 * 
 * Represents an alluvial filtering element that is used to query all objects with specific properties inside of a DSL, assuming an `input_value` {@link Array}<{@link any}> that returns an output value {@link Array}<{@link any}>.
 * 
 * ##### Constructor:
 * - `arg0_value`: {@link Object}
 *   - `.input_type="any"`: {@link string} - What the input type is regarded as being.
 *   - `.input_value`: {@link function}(arg0_input_value:{@link Array}<{@link any}>) | {@link function}(arg0_output_value:{@link Array}<{@link any}>)
 *   - `.output_type="any"`: {@link string} - What the output type is regarded as being.
 *
 * @augments ve.Component
 * @memberof ve.Component
 * @type {ve.NodeEditorFilter}
 */
ve.NodeEditorFilter = class extends ve.Component {
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = arg0_value;
		let options = (arg1_options) ? arg1_options : {};
			super(options);
		
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		options.input_type = (options.input_type) ? options.input_type : "any";
		options.output_type = (options.output_type) ? options.output_type : "any";
		
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-node-editor");
			HTML.setAttributesObject(this.element, options.attributes);
			this.element.instance = this;
		this.options = options;
	}
	
	drawNodeEditorDatatype () {
		
	}
	
	run (arg0_input_value) {
		
	}
}