/**
 * Refer to <span color = "yellow">{@link ve.Component}</span> for methods or fields inherited from this Component's parent such as `.options.attributes` or `.element`.
 * 
 * Creates a drag-and-drop Node Editor using Maptalks. Note that the entire state is stored in Maptalks, with scripts and metadata in the properties portion of Geometry symbols.
 * 
 * All nodes are implemented as a {@link maptalks.GeometryCollection}, with [0] containing node data and [n] containing other visual geometries. The ID of the GeometryCollection is the same as that of the Node. Their class type is implemented as a {@link ve.NodeEditorDatatype}.
 * 
 * ##### Constructor:
 * - `arg0_value`: {@link Object} - The JSON object for the Maptalks instance attached to the current NodeEditor, including properties data.
 * - `arg1_options`: {@link Object}
 *   - `.bg_ctx`: {@link function} | {@link Object} - Returns the context of a Canvas.
 *   - `.category_types`: {@link Object}
 *     - `<category_key>`: {@link Object}
 *       - `.colour`: {@link Array}<{@link number}, {@link number}, {@link number}>|{@link string} - Either a hex/RGB value.
 *   - `.node_types`: {@link Object}
 *     - `<node_key>`: {@link Object}
 *       - `.category="Expression"` - The category that any {@link ve.NodeEditorDatatype} instances should belong to. Typically should either be 'Filter'/'Expression'.
 *       - `.input_parameters=[]`: {@link Array}<{@link Object}> - The types of input parameters that will be accepted for evaluation.
 *         - `[n]`: {@link Object}
 *           - `.name`: {@link string}
 *           - `.type`: {@link string}
 *     - `.name`: {@link string}
 *     - `.output_type="any"`: {@link string} - What the output (return) type is regarded as being. There can only be a single return type per Node, similar to functions in most programming languages.
 *     - `.special_function`: {@link function}(argn_arguments:{@link any}) ¦ {@link any} - If a filter, it should return an {@link Array}<{@link any}>.
 *     - 
 *     - `.options`: {@link Object}
 *       - `.alluvial_scaling=1`: {@link number} - How much to scale alluvial widths by when displayed compared to their actual number.
 *   	   - `.id=Class.generateRandomID(ve.NodeEditorDatatype)`: {@link string} - The ID to assign to the present datatype at a class level.
 *       - `.show_alluvial=false`: {@link boolean}
 *   - `.polling=100`: {@link number} - How often the current setup should be polled to evaluate alluvials and number of items affected. 100ms by default. -1 = never.
 * 
 * ##### Instance:
 * - `.v`: {@link HTMLElement}
 * 
 * ##### Methods:
 * 
 * @augments ve.Component
 * @memberof ve.Component
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
		options.category_types = (options.category_types) ? options.category_types : {};
		options.node_types = (options.node_types) ? options.node_types : {};
		options.polling = Math.returnSafeNumber(options.polling, 100);
		options.style = {
			height: "50vh",
			width: "50vw",
			
			".maptalks-all-layers, .maptalks-canvas-layer, .maptalks-wrapper": {
				position: "static"
			},
			".maptalks-attribution": {
				display: "none"
			},
			...options.style
		};
		
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-node-editor");
			HTML.setAttributesObject(this.element, options.attributes);
			this.element.instance = this;
		this.map = new maptalks.Map(this.element, {
			center: [0, 0],
			zoom: 14,
			baseLayer: this.getDefaultBaseLayer(),
		});
			this.node_layer = new maptalks.VectorLayer("nodes", [], { hitDetect: true });
		this.node_layer.addTo(this.map);
		this.options = options;
		this.main = {
			nodes: [],
			settings: { //[WIP] - Implement settings
				display_expressions_with_numbers: true,
				display_filters_as_alluvial: true,
				display_filters_with_numbers: true
			},
			user: {
				selected_nodes: []
			},
			variables: {} //Used to store variables during a single run-cycle
		}; 
		this.value = value;
		
		//Set map bindings
		this.map.addEventListener("click", (e) => {
			this._mouse_coords = e.coordinate;
		});
		this.map.addEventListener("contextmenu", (e) => {
			this._mouse_coords = e.coordinate;
			this.drawToolbox();
		});
		this.map.addEventListener("mousemove", (e) => {
			this._mouse_coords = e.coordinate;
		});
		
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
	
	_connect (arg0_node, arg1_node, arg2_index, arg3_options) {
		//Convert from parameters
		let node = arg0_node;
		let ot_node = arg1_node;
		let index = arg2_index;
		let options = (arg3_options) ? arg3_options : {};
		
		if (node.getConnection(ot_node, index) !== -1) //Internal guard clause if connection already exists
			if (options.toggle_connection) {
				this._disconnect(node, ot_node, index);
				return;
			} else {
				return;
			}
		
		//Attempt to connect the two nodes
		node.connections.push([ot_node, index]);
		ve.NodeEditorDatatype.draw();
	}

	_disconnect (arg0_node, arg1_node, arg2_index) {
		//Convert from parameters
		let node = arg0_node;
		let ot_node = arg1_node;
		let index = arg2_index;
		
		//Check to make sure that node_connection isn't 1
		let node_connection_index = node.getConnection(ot_node, index);
		
		if (node_connection_index !== -1) {
			node.connections.splice(node_connection_index, 1);
			ve.NodeEditorDatatype.draw();
		}
	}
	
	_select (arg0_node, arg1_index) {
		//Convert from parameters
		let node = arg0_node;
		let index = arg1_index;
		
		//Declare local instance variables
		let selected_nodes = this.main.user.selected_nodes;
		
		//Internal guard clauses
		{
			//0. If selection already exists, clear it instead
			for (let i = selected_nodes.length - 1; i >= 0; i--) {
				
				if (selected_nodes[i][0].id === node.id && selected_nodes[i][1] === index) {
					this.main.user.selected_nodes.splice(i, 1);
					ve.NodeEditorDatatype.draw();
					return;
				} else if (selected_nodes[i][0].id === node.id) {
					this.main.user.selected_nodes.splice(i, 1);
					continue;
				}
			}
				
			//1. Check if selection is valid first
			if (selected_nodes.length >= 1)
				if (selected_nodes[0][1] > 0 && index > 0) return; //Input > Input isn't valid
		}
		
		//Manage selected_nodes
		selected_nodes.push([node, index]);
		
		if (selected_nodes.length >= 2) {
			//Attempt to connect the two nodes
			this._connect(selected_nodes[0][0], selected_nodes[1][0], selected_nodes[1][1], {
				toggle_connection: true
			});
			selected_nodes = [];
		}
		this.main.user.selected_nodes = selected_nodes;
		ve.NodeEditorDatatype.draw();
	}
	
	clear () { //[WIP] - Finish function body
		
	}
	
	drawToolbox () { //[WIP] - Finish function body; rework unique_categories
		//Declare local instance 
		let page_menu_obj = {};
		let unique_categories = [];
		
		//Populate unique_categories
		Object.iterate(this.options.node_types, (local_key, local_value) => {
			if (local_value.category && !unique_categories.includes(local_value.category))
				unique_categories.push(local_value.category);
		});
		if (unique_categories.length === 0)
			unique_categories = ["Expressions", "Filters"];
		
		//Populate page_menu_obj
		for (let i = 0; i < unique_categories.length; i++) {
			let local_search_select_obj = {};
			
			Object.iterate(this.options.node_types, (local_key, local_value) => {
				let local_category_options = this.options.category_types[local_value.category];
					local_category_options = (local_category_options) ? local_category_options : {};
				
				let local_category_colour = (local_category_options.colour) ? 
					local_category_options.colour : [255, 255, 255];
					local_category_colour = Colour.convertRGBAToHex(local_category_colour);
					
				let local_category_text_colour = (local_category_options.text_colour) ?
					local_category_options.text_colour : [0, 0, 0];
					local_category_text_colour = Colour.convertRGBAToHex(local_category_text_colour);
				
				if (local_value.category === unique_categories[i])
					local_search_select_obj[local_key] = new ve.Button(() => {
						this.main.nodes.push(new ve.NodeEditorDatatype({
							coords: this._mouse_coords,
							key: local_key,
							...local_value
						}, {
							category_options: local_category_options,
							node_editor: this,
							...local_value.options
						}));
					}, { 
						name: (local_value.name) ? local_value.name : local_key,
						style: {
							"button": { 
								backgroundColor: local_category_colour,
								color: local_category_text_colour
							}
						}
					});
			});
			
			page_menu_obj[unique_categories[i]] = {
				name: unique_categories[i],
				components_obj: {
					search_select: new ve.SearchSelect(local_search_select_obj)
				}
			};
		}
		
		//Draw ve.PageMenuWindow
		if (this.toolbox_window) this.toolbox_window.close();
		this.toolbox_window = new ve.PageMenuWindow(page_menu_obj, {
			name: "Toolbox",
			width: "22rem",
			
			can_rename: false
		});
	}
	
	getCanvas () {
		//Declare local instance variables
		if (!this._canvas)
			this._canvas = document.createElement("canvas");
		
		//Return statement
		return this._canvas;
	};
	
	getDefaultBaseLayer () {
		//Declare local instance variables
		let base_layer = new maptalks.TileLayer("base", {
			urlTemplate: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
			subdomains: ["a", "b", "c"],
			repeatWorld: true
		});
		
		//Set base_layer functions
		base_layer.getBase64Image = (arg0_image) => {
			//Convert from parameters
			let img = arg0_image;
			
			//Declare local instance variables
			let canvas = this.getCanvas();
				canvas.height = img.height;
				canvas.width = img.width;
			let ctx = canvas.getContext('2d');
			
			//Draw scene for rect
			if (this.options.bg_ctx) {
				ctx = this.options.bg_ctx(ctx);
			} else {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(img, 0, 0);
				
				//Draw background
				ctx.fillStyle = `rgba(25, 25, 25, 1)`;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				
				ctx.save();
				ctx.strokeStyle = `rgba(255, 255, 255, 0.5)`;
				ctx.lineWidth = 1;

				//Draw 8x8 grid
				let columns = 8;
				let rows = 8;
				
				let cell_height = canvas.height/rows;
				let cell_width = canvas.width/columns;

				//Draw vertical lines
				for (let i = 0; i <= columns; i++) {
					let local_x = i*cell_width;
					
					ctx.beginPath();
					ctx.moveTo(local_x, 0);
					ctx.lineTo(local_x, canvas.height);
					ctx.stroke();
				}

				//Draw horizontal lines
				for (let i = 0; i <= rows; i++) {
					let local_y = i*cell_height;
					
					ctx.beginPath();
					ctx.moveTo(0, local_y);
					ctx.lineTo(canvas.width, local_y);
					ctx.stroke();
				}
				
				ctx.restore();
			}
			
			//Return statement
			return canvas.toDataURL('image/jpg', 0.7);
		};
		base_layer.getTileUrl = function (x, y, z) {
			//Return statement
			return maptalks.TileLayer.prototype.getTileUrl.call(this, x, y, z);
		}
		base_layer.on("renderercreate", (e) => {
			e.renderer.loadTileImage = (arg0_image, arg1_url) => {
				//Convert from parameters
				let img = arg0_image;
				let url = arg1_url;
				
				//Declare local instance variables
				let remote_image = new Image();
					remote_image.crossOrigin = "anonymous";
					remote_image.onload = () =>
						img.src = base_layer.getBase64Image(remote_image);
					remote_image.src = url;
			};
		});
		
		//Return statement
		return base_layer;
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
};