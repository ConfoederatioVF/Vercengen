/**
 * Refer to <span color = "yellow">{@link ve.Component}</span> for methods or fields inherited from this Component's parent such as `.options.attributes` or `.element`.
 * 
 * ##### Constructor:
 * - `arg0_value`: {@link Object}
 *   - `.category="Expression"` - The category that any {@link ve.NodeEditorDatatype} instances should belong to. Typically should either be 'Filter'/'Expression'.
 *   - `.coords`: {@link maptalks.Coordinate}|{x: {@link number}, y: {@link number}}
 *   - `.input_parameters=[]`: {@link Array}<{@link Object}> - The types of input parameters that will be accepted for evaluation.
 *     - `[n]`: {@link Object}
 *       - `.name`: {@link string}
 *       - `.type`: {@link string}
 *   - `.key`: {@link string}
 *   - `.name`: {@link string}
 *   - `.output_type="any"`: {@link string} - What the output (return) type is regarded as being. There can only be a single return type per Node, similar to functions in most programming languages.
 *   - `.special_function`: {@link function}(argn_arguments:{@link any}) ¦ {@link any} - If a filter, it should return an {@link Array}<{@link any}>.
 * - `arg1_options`: {@link Object}
 *   - `.alluvial_scaling=1`: {@link number} - How much to scale alluvial widths by when displayed compared to their actual number.
 *   - `.id=Class.generateRandomID(ve.NodeEditorDatatype)`: {@link string} - The ID to assign to the present datatype at a class level.
 *   - `.node_editor`: {@link ve.NodeEditor} - The node editor that this ve.NodeEditorDatatype is attached to.
 *   - `.show_alluvial=false`: {@link boolean}
 *
 * @augments ve.Component
 * @memberof ve.Component
 * @type {ve.NodeEditorDatatype}
 */
ve.NodeEditorDatatype = class extends ve.Component {
	static instances = [];
	
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = arg0_value;
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Declare local instance variables
		this.connections = []; //[[ve.NodeEditorDatatype, index], ...];
		this.geometries = [];
		this.id = Class.generateRandomID(ve.NodeEditorDatatype);
		this.options = options;
		this.value = value;
		
		//Draw call
		this.draw();
		ve.NodeEditorDatatype.instances.push(this);
	}
	
	_render () {
		//Add all geometries to layer
		for (let i = 0; i < this.geometries.length; i++) try {
			this.geometries[i].addTo(this.options.node_editor.node_layer);
			if (this.geometries[i] instanceof maptalks.ArcConnectorLine)
				this.geometries[i]._showConnect();
		} catch (e) { console.warn(e); }
	}
	
	draw () {
		//Declare local instance variables
		let coords = this.value.coords;
		
		//Remove all this.geometries first
		for (let i = 0; i < this.geometries.length; i++)
			this.geometries[i].remove();
		this.geometries = [];
		
		//Set this.primary_geometry based on .coords
		{
			let primary_geometry = new maptalks.Rectangle(coords, 2000, 400, {
				properties: { id: this.id },
				symbol: {
					polygonFill: "rgb(135,196,240)",
					polygonOpacity: 0.8,
					textName: (this.value.name) ? this.value.name : this.value.key,
					'textFaceName' : 'monospace',
					'textFill' : '#34495e',
					'textHaloFill' : '#fff',
					'textHaloRadius' : 4,
					'textSize'  : { stops: [[7, 2], [14, 18]] },
					'textWeight' : 'bold'
				}
			});
				let primary_left_marker = new maptalks.Marker(
					Geospatiale.translatePoint(coords, 0, -400*0.5),
					{
						properties: {
							index: 0,
							type: "output"
						},
						symbol: {
							'textFill' : 'white',
							textName: "•",
							textSize: { stops: [[7, 2], [14, 36]] }
						}
					}
				);
				let primary_right_marker = new maptalks.Marker(
					Geospatiale.translatePoint(coords, 2000, -400*0.5),
					{
						properties: {
							index: 0,
							type: "output"
						},
						symbol: {
							'textFill' : 'white',
							textName: "•",
							textSize: { stops: [[7, 2], [14, 36]] }
						}
					}
				);
			this.geometries.push(
				new maptalks.GeometryCollection([primary_geometry, primary_left_marker, primary_right_marker], {
					draggable: true
				})
			);
		}
		
		//Iterate over all this.value.input_parameters and insert them from 1-n
		for (let i = 0; i < this.value.input_parameters.length; i++) {
			let local_rect = new maptalks.Rectangle(
				Geospatiale.translatePoint(coords, 0, -400*(i + 1)),
				2000, 400,
				{
					symbol: {
						polygonFill: "rgb(135,196,240)",
						polygonOpacity: 0.5,
						textName: `${this.value.input_parameters[i].name} (${this.value.input_parameters[i].type})`,
						'textFaceName' : 'monospace',
						'textFill' : '#34495e',
						'textHaloFill' : '#fff',
						'textHaloRadius' : 4,
						'textSize'  : { stops: [[7, 2], [14, 18]] },
						'textWeight' : 'bold'
					}
				}
			);
				let local_left_marker = new maptalks.Marker(
					Geospatiale.translatePoint(coords, 0, -400*(i + 1) - 400*0.5),
					{
						properties: {
							index: i + 1,
							type: "input"
						},
						symbol: {
							'textFill' : `rgba(255, 255, 255, 0.5)`,
							textName: "•",
							textSize: { stops: [[7, 2], [14, 36]] }
						}
					}
				);
			
			//Refresh this.geometries[i + 1]
			this.geometries.push(new maptalks.GeometryCollection([local_rect, local_left_marker]));
		}
		
		//Draw connections; must be drawn after other nodes have finished rendering
		setTimeout(() => {
			for (let i = 0; i < this.connections.length; i++) {
				let arc_connector_line = new maptalks.ArcConnectorLine(
					this.geometries[0].getGeometries()[2],
					ve.NodeEditorDatatype.getNode(this.connections[i][0]).geometries[this.connections[i][1]][1],
					{
						arcDegree: 90,
						arrowStyle : 'classic',
						arrowPlacement : 'vertex-last',
						showOn: "always",
						symbol: {
							lineColor: 'white',
							lineWidth: 2
						}
					}
				);
				this.geometries.push(arc_connector_line);
			}
			this._render();
		}, 100);
		this._render();
		
		//Call this.handleEvents()
		this.handleEvents();
	}
	
	fromJSON () {
		
	}
	
	handleEvents () {
		this.geometries[0].addEventListener("dragend", (e) => {
			this.value.coords = this.geometries[0].getFirstCoordinate();
			this.draw();
		});
	}
	
	hasConnection (arg0_node, arg1_index) {
		//Convert from parameters
		let node = arg0_node;
		let index = Math.returnSafeNumber(arg1_index);
		
		//Iterate over all this.connections for an exact match
		for (let i = 0; i < this.connections.length; i++)
			if (this.connections[i][0].id === node.id && this.connections[i][1] === index)
				//Return statement
				return true;
	}
	
	toJSON (arg0_json) {
		
	}
	
	static getNode (arg0_node_id) {
		//Convert from parameters
		let node_id = arg0_node_id;
			if (node_id instanceof ve.NodeEditorDatatype) return node_id; //Internal guard clause for ve.NodeEditorDatatype
		
		//Iterate over all ve.NodeEditorDatatype instances
		for (let i = 0; i < ve.NodeEditorDatatype.instances.length; i++)
			if (ve.NodeEditorDatatype.instances[i].id === node_id)
				//Return statement; first exact match
				return ve.NodeEditorDatatype.instances[i];
	}
}