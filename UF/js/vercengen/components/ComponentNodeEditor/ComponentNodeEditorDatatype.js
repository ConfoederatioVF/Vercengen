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
		this.geometries = [];
		this.id = Class.generateRandomID(ve.NodeEditorDatatype);
		this.options = options;
		this.primary_geometry = new maptalks.GeometryCollection([], {
			draggable: true
		});
		this.value = value;
		
		//Populate this.geometries
		this.geometries.push(this.primary_geometry);
		
		if (this.options.node_editor) {
			let node_editor = this.options.node_editor;
			
			this.primary_geometry.addTo(node_editor.node_layer);
		}
		
		//Draw call
		this.draw();
		ve.NodeEditorDatatype.instances.push(this);
	}
	
	draw () {
		//Declare local instance variables
		let coords = this.value.coords;
		
		//Set this.primary_geometry based on .coords
		let primary_geometry = new maptalks.Rectangle(coords, 2000, 400, {
			properties: {
				id: this.id,
				connections: []
			},
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
		this.primary_geometry.setGeometries([primary_geometry, primary_left_marker, primary_right_marker]);
		
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
			if (this.geometries[i + 1]) this.geometries[i + 1].remove();
			this.geometries[i + 1] = new maptalks.GeometryCollection([local_rect, local_left_marker]);
			if (this.options.node_editor)
				this.geometries[i + 1].addTo(this.options.node_editor.node_layer);
		}
		
		//Call this.handleEvents()
		this.handleEvents();
	}
	
	handleEvents () {
		this.primary_geometry.addEventListener("dragend", (e) => {
			this.value.coords = this.primary_geometry.getFirstCoordinate();
			this.draw();
		});
	}
}