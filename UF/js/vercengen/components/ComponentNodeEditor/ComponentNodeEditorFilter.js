/**
 * Refer to <span color = "yellow">{@link ve.Component}</span> for methods or fields inherited from this Component's parent such as `.options.attributes` or `.element`.
 * 
 * Represents an alluvial filtering element that is used to query all objects with specific properties inside of a DSL, assuming an `input_value` {@link Array}<{@link any}> that returns an output value {@link Array}<{@link any}>. Mutations require a {@link ve.NodeEditorExpression} instead.
 * 
 * ##### Constructor:
 * - `arg0_value`: {@link Object}
 *   - `.input_type="any"`: {@link string} - What the input type is regarded as being. If set to 'none', the Node will take in no other input type. Represented by the [0] slot.
 *   - `.input_parameters=[]`: {@link Array}<{@link string}> - The types of input parameters that will be accepted for evaluation. Represented by the [n] slot.
 *   - `.input_value`: {@link function}(arg0_input_value:{@link Array}<{@link any}>, arg1_options:{@link Object}) | {@link function}(arg0_output_value:{@link Array}<{@link any}>)
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
		options.input_parameters = [];
		options.input_type = (options.input_type) ? options.input_type : "any";
		options.output_type = (options.output_type) ? options.output_type : "any";
		
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-node-editor");
			HTML.setAttributesObject(this.element, options.attributes);
			this.element.instance = this;
		this.geometry = new maptalks.GeometryCollection([]);
		this.options = options;
	}
	
	/**
	 * Connects a {@link ve.NodeEditorFilter} to another {@link ve.NodeEditorFilter} in the [0] slot.
	 * 
	 * @param arg0_component_obj
	 */
	_connect (arg0_component_obj) {
		
	}
	
	_disconnect (arg0_component_obj) {
		
	}
	
	/**
	 * Refreshes the present {@link this.geometry}, especially relating to [n] positions which contain arc connectors and other nodes.
	 */
	draw () {
		
	}
	
	drawNodeEditorDatatype () {
		//Return statement
	}
	
	run (arg0_input_value) {
		//Convert from parameters
		let input_value = (arg0_input_value) ? arg0_input_value : [];
	}
}