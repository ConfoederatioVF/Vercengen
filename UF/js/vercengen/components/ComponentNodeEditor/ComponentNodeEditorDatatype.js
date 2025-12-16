/**
 * Refer to <span color = "yellow">{@link ve.Component}</span> for methods or fields inherited from this Component's parent such as `.options.attributes` or `.element`.
 * 
 * Represents an alluvial filtering element that is used to query all objects with specific properties inside of a DSL, assuming an `input_value` {@link Array}<{@link any}> that returns an output value {@link Array}<{@link any}>. Mutations require a {@link ve.NodeEditorExpression} instead.
 * 
 * ##### Constructor:
 * - `arg0_value`: {@link Object}
 *   - `.category="Expression"` - The category that this {@link ve.NodeEditorDatatype} should belong to. Typically should either be 'Filter'/'Expression'.
 *   - `.input_parameters=[]`: {@link Array}<{@link string}> - The types of input parameters that will be accepted for evaluation.
 *   - `.output_type="any"`: {@link string} - What the output (return) type is regarded as being. There can only be a single return type per Node, similar to functions in most programming languages.
 *   - `.special_function`: {@link function}(argn_arguments:{@link any}) | {@link any} - If a filter, it should return an {@link Array}<{@link any}>.
 * - `arg1_options`: {@link Object}
 *   - `.alluvial_scaling=1`: {@link number} - How much to scale alluvial widths by when displayed compared to their actual number.
 *   - `.id=Class.generateRandomID(ve.NodeEditorDatatype)`: {@link string} - The ID to assign to the present datatype at a class level.
 *   - `.show_alluvial=false`: {@link boolean}
 * 
 * ##### Instance:
 * - `.alluvial_value`: {@link number} - Gets/sets the value of the connecting alluvial line in px, as scaled by `arg1_options.alluvial_scaling`.
 *
 * @augments ve.Component
 * @memberof ve.Component
 * @type {ve.NodeEditorDatatype}
 */
ve.NodeEditorDatatype = class extends ve.Component { //[WIP] - Refactor to generic ve.NodeEditorDatatype
	static instances = [];
	
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		let options = (arg1_options) ? arg1_options : {};
			super(options);
		
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		options.alluvial_scaling = Math.returnSafeNumber(options.alluvial_scaling, 1);
		
		//Initialise value
		console.log(value.input_parameters);
		value.category = (value.category) ? value.category : "Expression";
		value.input_parameters = (value.input_parameters) ? value.input_parameters : [];
		value.input_type = (value.input_type) ? value.input_type : "any";
		value.output_type = (value.output_type) ? value.output_type : "any";
		
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-node-editor-datatype");
			HTML.setAttributesObject(this.element, options.attributes);
			this.element.instance = this;
		this.id = (options.id) ? options.id : Class.generateRandomID(ve.NodeEditorDatatype);
		this.options = options;
		this.value = value;
		console.log(this.value.input_parameters);
		
		//Push to NodeEditorFilter.instances
		ve.NodeEditorDatatype.instances.push(this);
	}
	
	/**
	 * Returns a {@link maptalks.GeometryCollection} used as a constructor for creating a new instance on the parent {@link ve.NodeEditor}.
	 */
	draw (arg0_coords) {
		//Convert from parameters
		let coords = (arg0_coords) ? arg0_coords : new maptalks.Coordinate(0, 0);
		
		//Declare local instance variables
		let geometry = new maptalks.GeometryCollection([], {
			draggable: true
		});
		let parameter_geometries = [];
		
		//Render primary geometry as a draggable maptalks.ui.UIMarker followed by arc connectors
		let primary_geometry = new maptalks.TextBox("Node Type", coords, 200, 40, {
			'textStyle' : {
				'wrap' : true,          // auto wrap text
				'padding' : [12, 12],    // padding of textbox
				'verticalAlignment' : 'top',
				'horizontalAlignment' : 'center',
				'symbol' : {
					'textFaceName' : 'monospace',
					'textFill' : '#34495e',
					'textHaloFill' : '#fff',
					'textHaloRadius' : 4,
					'textSize' : 18,
					'textWeight' : 'bold'
				}
			},
			'boxSymbol': {
				// box's symbol
				'markerType' : 'square',
				'markerFill' : 'rgb(135,196,240)',
				'markerFillOpacity' : 0.9,
				'markerLineColor' : '#34495e',
				'markerLineWidth' : 1
			}
		});
		
		//Iterate over all this.value.input_parameters
		for (let i = 0; i < this.value.input_parameters.length; i++) {
			let local_marker = new maptalks.TextBox(`Input ${i + 1} (${this.value.input_parameters[i]})`, coords, 200, 40, {
				'textStyle' : {
					'wrap' : true,          // auto wrap text
					'padding' : [12, 12 + 40*(i + 1)],    // padding of textbox
					'verticalAlignment' : 'top',
					'horizontalAlignment' : 'center',
					'symbol' : {
						'textFaceName' : 'monospace',
						'textFill' : 'white',
						textFillOpacity: 0.9,
						'textSize' : 18,
						'textWeight' : 'bold',
					}
				},
				'boxSymbol': {
					// box's symbol
					'markerDy': 40*(i + 1),
					'markerType' : 'square',
					'markerFill' : 'rgb(135,196,240)',
					'markerFillOpacity' : 0.5,
					'markerLineColor' : '#34495e',
					'markerLineWidth' : 1
				}
			})
				parameter_geometries.push(local_marker);
		}
		geometry.setGeometries([primary_geometry, ...parameter_geometries]);
		
		//Return statement
		return geometry;
	}
	
	drawNodeEditorDatatype () {
		//Return statement
		return new ve.Button(() => {
			let new_geometry = this.draw(this._node_editor_instance._mouse_coords);
				new_geometry.addTo(this._node_editor_instance.node_layer);
		}, { 
			name: `${(this.options.name) ? this.options.name : "Node Type"}`
		});
	}
	
	setNodeEditorInstance (arg0_node_editor) {
		//Convert from parameters
		let node_editor = arg0_node_editor;
		
		//Declare local instance variables
		this._node_editor_instance = node_editor;
	}
	
	static connect (arg0_geometry_collection, arg1_geometry_collection, arg2_index) {
		//Convert from parameters
		let geometry_collection = arg0_geometry_collection;
		let ot_geometry_collection = arg1_geometry_collection;
		let index = Math.returnSafeNumber(arg2_index);
		
		//Declare local instance variables
		
	}
	
	static disconnect (arg0_geometry_collection, arg1_geometry_collection) {
		
	}
	
	static run (arg0_geometry_collection, argn_arguments) {
		
	}
}