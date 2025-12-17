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
		let primary_geometry = new maptalks.Rectangle(coords, 2000, 400, {
			symbol: {
				polygonFill: "rgb(135,196,240)",
				polygonOpacity: 0.8,
				textName: "Node Name",
				'textFaceName' : 'monospace',
				'textFill' : '#34495e',
				'textHaloFill' : '#fff',
				'textHaloRadius' : 4,
				'textSize' : 18,
				'textWeight' : 'bold'
			}
		});
		
		//Iterate over all this.value.input_parameters
		for (let i = 0; i < this.value.input_parameters.length; i++) {
			console.log(coords);
			let local_marker = new maptalks.Rectangle(
				Geospatiale.translatePoint(coords, 0, -400*(i + 1)), 
				2000, 400, 
				{
					symbol: {
						polygonFill: "rgb(135,196,240)",
						polygonOpacity: 0.5,
						textName: `Input ${i + 1} (${this.value.input_parameters[i]})`,
						'textFaceName' : 'monospace',
						'textFill' : '#34495e',
						'textHaloFill' : '#fff',
						'textHaloRadius' : 4,
						'textSize' : 18,
						'textWeight' : 'bold'
					}
				}
			);
				parameter_geometries.push(local_marker);
		}
		geometry.setGeometries([primary_geometry, ...parameter_geometries]);
		geometry.on("click", (e) => {
			let selected_nodes = ve.NodeEditorDatatype._getSelectedNodes(this._node_editor_instance);
				if (selected_nodes.length === 0)
					if (e.pickGeometryIndex !== 0) return;
				if (selected_nodes.length === 1)
					if (!(e.pickGeometryIndex > 0 && e.pickGeometryIndex < this.value.input_parameters.length + 1)) return;
			let geometries = geometry.getGeometries();
			
			//Adjust properties
			{
				let current_marker = geometries[e.pickGeometryIndex];
				let current_properties = current_marker.getProperties();
				
				//Iterate over all geometries and refresh their state; rest marker handling
				for (let i = 0; i < geometries.length; i++) {
					let local_properties = geometries[i].getProperties();
						if (local_properties)
							delete local_properties.is_selected;
					
					geometries[i].setProperties(local_properties);
				}
				
				//Current marker handling
				current_marker.setProperties({
					...current_marker.getProperties(),
					is_selected: (!current_properties?.is_selected)
				});
				
				//Event handling
				//Connection
				{
					selected_nodes = ve.NodeEditorDatatype._getSelectedNodes(this._node_editor_instance);
					
					if (selected_nodes.length >= 2) {
						ve.NodeEditorDatatype._deselectAll(this._node_editor_instance);
						ve.NodeEditorDatatype.connect(selected_nodes[0][0], selected_nodes[1][0], selected_nodes[1][1]);
						console.log(`ve.NodeEditorDatatype.connect:`, selected_nodes[0][0], selected_nodes[1][0], selected_nodes[1][1]);
					}
				}
			}
			
			ve.NodeEditorDatatype._draw(this._node_editor_instance);
		});
		geometry.on("dragend", (e) => ve.NodeEditorDatatype._draw(this._node_editor_instance));
		
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
	
	static _deselectAll (arg0_node_editor) {
		//Convert from parameters
		let node_editor = arg0_node_editor;
		
		//Declare local instance variables
		let node_geometries = node_editor.node_layer.getGeometries();
		
		//Iterate over all node_geometries and remove their selection, then rerender
		for (let i = 0; i < node_geometries.length; i++)
			if (node_geometries[i] instanceof maptalks.GeometryCollection) {
				let local_geometries = node_geometries[i].getGeometries();
				
				for (let x = 0; x < local_geometries.length; x++) {
					let local_properties = local_geometries[x].getProperties();
					let local_symbol = local_geometries[x].getSymbol();
					
					if (local_properties)
						delete local_properties.is_selected;
					local_symbol.markerLineColor = "#34495e";
					
					local_geometries[x].setProperties(local_properties);
					local_geometries[x].setSymbol(local_symbol);
				}
			}
	}
	
	static _draw (arg0_node_editor) {
		//Convert from parameters
		let node_editor = arg0_node_editor;
		
		//Declare local instance variables
		let node_geometries = node_editor.node_layer.getGeometries();
		
		for (let i = 0; i < node_geometries.length; i++)
			if (node_geometries[i] instanceof maptalks.GeometryCollection) {
				let local_geometries = node_geometries[i].getGeometries();
				
				for (let x = 0; x < local_geometries.length; x++)
					if (local_geometries[x] instanceof maptalks.ArcConnectorLine) {
						local_geometries[x]._showConnect();
					} else if (local_geometries[x] instanceof maptalks.Rectangle) {
						let local_properties = local_geometries[x].getProperties();
							if (!local_properties) continue;
						let local_symbol = local_geometries[x].getSymbol();
						
						if (local_properties.is_selected) {
							local_symbol.lineColor = "yellow";
						} else {
							local_symbol.lineColor = "#34495e";
						}
						local_geometries[x].setSymbol(local_symbol);
					}
			}
	}
	
	static _getSelectedNodes (arg0_node_editor) {
		//Convert from parameters
		let node_editor = arg0_node_editor;
		
		//Iterate over node_editor.node_layer
		let node_geometries = node_editor.node_layer.getGeometries();
		let selected_indexes = []; //[[maptalks.GeometryCollection, index], ...];
		
		for (let i = 0; i < node_geometries.length; i++)
			if (node_geometries[i] instanceof maptalks.GeometryCollection) {
				let local_geometries = node_geometries[i].getGeometries();
				
				for (let x = 0; x < local_geometries.length; x++) {
					let local_properties = local_geometries[x].getProperties();
					
					if (local_properties?.is_selected)
						selected_indexes.push([node_geometries[i], x]);
				}
			}
		
		//Return statement
		return selected_indexes;
	}
	
	static connect (arg0_geometry_collection, arg1_geometry_collection, arg2_index) {
		//Convert from parameters
		let geometry_collection = arg0_geometry_collection;
		let ot_geometry_collection = arg1_geometry_collection;
		let index = Math.returnSafeNumber(arg2_index);
		
		//Declare local instance variables
		let geometries = geometry_collection.getGeometries();
		
		let arc_connector = new maptalks.ArcConnectorLine(
			geometries[0],
			ot_geometry_collection.getGeometries()[index],
			{
				arcDegree: 90,
				showOn: "always",
				symbol: {
					lineColor: 'white',
					lineWidth: 2
				}
			}
		);
		
		//Set new geometries
		geometry_collection.setGeometries([...geometries, arc_connector]);
	}
	
	static disconnect (arg0_geometry_collection, arg1_geometry_collection) {
		
	}
	
	static run (arg0_geometry_collection, argn_arguments) {
		
	}
}