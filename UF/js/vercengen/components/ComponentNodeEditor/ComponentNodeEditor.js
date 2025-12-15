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
		options.polling = Math.returnSafeNumber(options.polling, 100);
		options.style = {
			height: "80vh",
			width: "80vw",
			
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
			zoom: 1,
			baseLayer: this.getDefaultBaseLayer(),
		});
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
		
		//Set map bindings
		this.map.addEventListener("click", (e) => {
			console.log(e);
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
	
	addNode (arg0_component_obj, arg1_options) {
		
	}
	
	addNodeType (arg0_options) {
		
	}
	
	clear () { //[WIP] - Finish function body
		
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
			repeatWorld: false
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
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(img, 0, 0);
			
			ctx.save();
			ctx.filter = 'sepia(100%) invert(90%)';
			ctx.drawImage(img, 0, 0);
			ctx.restore();
			ctx.fillStyle = 'white';
			ctx.font = '20px Karla';
			ctx.textAlign = 'center';
			ctx.fillText(`It's a cool effect, no?`, canvas.width / 2, canvas.height / 2);
			
			ctx.strokeStyle = 'white';
			ctx.lineWidth = 0.1;
			ctx.rect(0, 0, canvas.width, canvas.height);
			ctx.stroke();
			
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
	
	removeNodeType (arg0_options) {
		
	}
};