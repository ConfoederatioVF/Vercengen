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
		this.value = (value) ? value : {};
		
		//Initialise value
		if (!this.value.name) this.value.name = this.value.key;
		
		//Draw call
		this.draw();
		ve.NodeEditorDatatype.instances.push(this);
	}
	
	_render () {
		//Add all geometries to layer
		for (let i = 0; i < this.geometries.length; i++) try {
			this.geometries[i].addTo(this.options.node_editor.node_layer);
		} catch (e) { console.warn(e); }
	}
	
	draw () {
		//Declare local instance variables
		let category_options = this.options.category_options;
		let coords = this.value.coords;
		
		let fill_colour = (category_options.colour) ? category_options.colour : "white";
			fill_colour = Colour.convertRGBAToHex(fill_colour);
		
		//Remove all this.geometries first
		for (let i = 0; i < this.geometries.length; i++)
			this.geometries[i].remove();
		this.geometries = [];
		
		//Set this.primary_geometry based on .coords
		{
			let primary_geometry = new maptalks.Rectangle(coords, 2000, 400, {
				properties: { id: this.id },
				symbol: {
					lineColor: (this.isSelected(0)) ? "yellow" : "black",
					
					polygonFill: fill_colour,
					polygonOpacity: 0.8,
					textName: this.value.name,
					textFaceName: "Karla",
					textFill: "white",
					textHaloFill: "black",
					textHaloRadius: 2,
					textSize: { stops: [[12, 2], [14, 14]] }
				}
			});
				let primary_left_marker = new maptalks.Marker(
					Geospatiale.translatePoint(coords, 0, -400*0.5),
					{
						symbol: {
							textFill: "white",
							textHaloFill: "black",
							textHaloRadius: 1,
							textName: "•",
							textSize: { stops: [[12, 2], [14, 36]] }
						}
					}
				);
				let primary_right_marker = new maptalks.Marker(
					Geospatiale.translatePoint(coords, 2000, -400*0.5),
					{
						symbol: {
							textFill: "white",
							textHaloFill: "black",
							textHaloRadius: 1,
							textName: "•",
							textSize: { stops: [[12, 2], [14, 36]] }
						}
					}
				);
			let primary_geometry_collection = new maptalks.GeometryCollection([primary_geometry, primary_left_marker, primary_right_marker], {
				draggable: true
			});
				primary_geometry_collection.addEventListener("click", (e) => {
					this.options.node_editor._select(this, 0);
				});
				primary_geometry_collection.addEventListener("contextmenu", (e) => {
					this.openContextMenu();
				});
			
			this.geometries.push(primary_geometry_collection);
		}
		
		//Iterate over all this.value.input_parameters and insert them from 1-n
		for (let i = 0; i < this.value.input_parameters.length; i++) {
			let local_rect = new maptalks.Rectangle(
				Geospatiale.translatePoint(coords, 0, -400*(i + 1)),
				2000, 400,
				{
					symbol: {
						lineColor: (this.isSelected(i + 1)) ? "yellow" : "black",
						
						polygonFill: fill_colour,
						polygonOpacity: 0.5,
						textName: `${this.value.input_parameters[i].name} (${this.value.input_parameters[i].type})`,
						textFaceName: "Karla",
						textFill: "white",
						textHaloFill: "black",
						textHaloRadius: 2,
						textSize: { stops: [[12, 2], [14, 14]] }
					}
				}
			);
				let local_left_marker = new maptalks.Marker(
					Geospatiale.translatePoint(coords, 0, -400*(i + 1) - 400*0.5),
					{
						symbol: {
							textFill: "rgba(255, 255, 255, 0.5)",
							textHaloFill: "black",
							textHaloRadius: 1,
							textName: "•",
							textSize: { stops: [[12, 2], [14, 36]] }
						}
					}
				);
			
			//Refresh this.geometries[i + 1]
			let local_geometry_collection = new maptalks.GeometryCollection([local_rect, local_left_marker]);
				local_geometry_collection.addEventListener("click", (e) => {
					this.options.node_editor._select(this, i + 1);
				});
				local_geometry_collection.addEventListener("contextmenu", (e) => {
					this.openContextMenu();
				});
			
			this.geometries.push(local_geometry_collection);
		}
		
		//Call local this._render(), then this.handleEvents()
		this._render();
		this.handleEvents();
	}
	
	fromJSON () {
		
	}
	
	getConnection (arg0_node, arg1_index) {
		//Convert from parameters
		let node = arg0_node;
		let index = Math.returnSafeNumber(arg1_index);
		
		//Iterate over all this.connections for an exact match
		for (let i = 0; i < this.connections.length; i++)
			if (this.connections[i][0].id === node.id && this.connections[i][1] === index)
				//Return statement
				return i;
		return -1;
	}
	
	isSelected (arg0_index) {
		//Convert from parameters
		let index = Math.returnSafeNumber(arg0_index);
		
		//Look over this.options.node_editor.main.user.selected_nodes
		let selected_nodes = this.options.node_editor.main.user.selected_nodes;
		
		//Iterate over all selected_nodes
		for (let i = 0; i < selected_nodes.length; i++)
			if (selected_nodes[i][0].id === this.id && selected_nodes[i][1] === index)
				//Return statement
				return true;
	}
	
	handleEvents () {
		this.geometries[0].addEventListener("dragend", (e) => {
			this.value.coords = this.geometries[0].getFirstCoordinate();
			ve.NodeEditorDatatype.draw();
		});
	}
	
	openContextMenu () {
		if (this.context_menu) this.context_menu.close();
		this.context_menu = new ve.Window({
			delete_button: veButton(() => {
				this.remove();
			}, { name: `<icon>delete</icon> Delete` })
		}, { name: this.value.name, can_rename: false });
	}
	
	remove () {
		//Iterate over ve.NodeEditorDatatype.instances
		for (let i = 0; i < ve.NodeEditorDatatype.instances.length; i++)
			if (ve.NodeEditorDatatype.instances[i].id === this.id)
				ve.NodeEditorDatatype.instances.splice(i, 1);
		
		//Iterate over all this.geometries and remove them
		for (let i = 0; i < this.geometries.length; i++)
			this.geometries[i].remove();
		this.geometries = [];
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
	
	static draw () {
		//1. Iterate over all ve.NodeEditorDatatypes and call their draw functions
		for (let i = 0; i < ve.NodeEditorDatatype.instances.length; i++)
			ve.NodeEditorDatatype.instances[i].draw();
		
		//2. Iterate over all ve.NodeEditorDatatypes and draw connections
		for (let i = 0; i < ve.NodeEditorDatatype.instances.length; i++) {
			let local_node = ve.NodeEditorDatatype.instances[i];
			
			//Iterate over all local_node.connections
			for (let x = 0; x < local_node.connections.length; x++) {
				//console.log(`Rendering arc connector for`, local_node, local_node.connections);
				let arc_connector_line = new maptalks.ArcConnectorLine(
					local_node.geometries[0].getGeometries()[2],
					ve.NodeEditorDatatype.getNode(local_node.connections[x][0]).geometries[local_node.connections[x][1]].getGeometries()[1],
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
				arc_connector_line.addTo(local_node.options.node_editor.node_layer);
				arc_connector_line._showConnect();
				local_node.geometries.push(arc_connector_line);
			}
		}
	}
}