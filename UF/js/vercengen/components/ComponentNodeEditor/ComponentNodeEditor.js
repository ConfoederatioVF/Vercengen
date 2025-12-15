/**
 * Refer to <span color = "yellow">{@link ve.Component}</span> for methods or fields inherited from this Component's parent such as `.options.attributes` or `.element`.
 * 
 * Creates a drag-and-drop Node Editor using Maptalks. Note that the entire state is stored in Maptalks, with scripts and metadata in the properties portion of Geometry symbols.
 * 
 * All nodes are implemented as a {@link maptalks.GeometryCollection}, with [0] containing node data and [n] containing other visual geometries. The ID of the GeometryCollection is the same as that of the Node.
 * 
 * ##### Constructor:
 * - `arg0_value`: {@link Object} - The JSON object for the Maptalks instance attached to the current NodeEditor, including properties data.
 * - `arg1_options`: {@link Object}
 * 
 * ##### Instance:
 * - `.v`: {@link HTMLElement}
 * 
 * ##### Methods:
 * 
 * @type {ve.NodeEditor}
 */
ve.NodeEditor = class extends ve.Component {
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = arg0_value;
		let options = (arg1_options) ? arg1_options : {};
			super(options);
		
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-node-editor");
			HTML.setAttributesObject(this.element, options.attributes);
			this.element.instance = this;
		this.map = new maptalks.Map(this.element);
			this.node_layer = new maptalks.VectorLayer("nodes", [], { hitDetect: true });
		this.node_layer.addTo(this.map);
		this.node_types = {};
		this.options = options;
		this._settings = { //[WIP] - Implement settings in subtypes
			display_expressions_with_numbers: true,
			display_filters_as_alluvial: true,
			display_filters_with_numbers: true
		};
		this.value = value;
		
		//Set .v
		this.v = this.value;
	}
	
	get v () {
		//Return statement
		return this.map.toJSON();
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
		
		//Set Map to maptalks JSON value
		maptalks.Map.fromJSON(this.element, value);
	}
	
	addNode (arg0_component_obj, arg1_options) {
		
	}
	
	addNodeType (arg0_options) {
		
	}
	
	clear () { //[WIP] - Finish function body
		
	}
	
	loadSettings (arg0_settings) {
		
	}
	
	/**
	 * Refreshes the nodes available in the toolbox.
	 * - Method of: {@link ve.NodeEditor}
	 * 
	 * @alias refresh
	 * @memberof ve.Component.ve.NodeEditor
	 */
	refresh () {
		
	}
	
	removeNode (arg0_component_obj) {
		
	}
	
	removeNodeType (arg0_options) {
		
	}
};