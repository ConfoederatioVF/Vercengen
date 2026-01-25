/**
 * Refer to <span color = "yellow">{@link ve.Component}</span> for methods or fields inherited from this Component's parent such as `.options.attributes` or `.element`.
 *
 * Creates a drag-and-drop Node Editor using Maptalks as a backend. Nodes are executed from a root node using a parallelised version of Kahn's algorithm, and nodes must form a directed acyclic graph (DAG). Circular references will not be executed if forced.
 *
 * If you need a loop, call `async run()` multiple times instead.
 * - Functional binding: <span color=00ffff>veNodeEditor</span>().
 *
 * ##### Constructor:
 * - `arg0_value`: {@link Object} - The JSON object for the Maptalks instance attached to the current NodeEditor, including properties data.
 * - `arg1_options`: {@link Object}
 *   - `.bg_ctx`: {@link function} | {@link Object} - Returns the context of a Canvas.
 *   - `.category_types`: {@link Object}
 *     - `<category_key>`: {@link Object}
 *       - `.colour`: {@link Array}<{@link number}, {@link number}, {@link number}>|{@link string} - Either a hex/RGB value.
 *   - `.disable_custom_nodes=false`: {@link boolean} - Whether to disable custom nodes editing.
 *   - `.disable_forse=false`: {@link boolean} - Whether to disable Forse Nodes.
 *   - `.exclude_all=false`: {@link boolean} - Whether to exclude the default 'All' category at the start.
 *   - `.node_types`: {@link Object}
 *     - `<node_key>`: {@link Object} - Current valid types for `.input_parameters` and `.output_type` include 'any'/'number[]'/'string[]'/'boolean'/'number'/'script'/'string'.
 *       - `.category="Expression"` - The category that any {@link ve.NodeEditorDatatype} instances should belong to. Typically should either be 'Filter'/'Expression'.
 *       - `.input_parameters=[]`: {@link Array}<{@link Object}> - The types of input parameters that will be accepted for evaluation.
 *         - `[n]`: {@link Object}
 *           - `.name`: {@link string}
 *           - `.type`: {@link string}
 *       - `.output_type="any"`: {@link string}
 *     - `.name`: {@link string}
 *     - `.output_type="any"`: {@link string} - What the output (return) type is regarded as being. There can only be a single return type per Node, similar to functions in most programming languages.
 *     - `.special_function`: {@link function}(argn_arguments:{@link any}) ¦ {@link Object}
 *       - Returns:
 *       - `.abort=false`: {@link boolean} - Whether to abort the current node branch from further execution (conditional branching).
 *       - `.alluvial_width=1`: {@link number}
 *       - `.display_value`: {@link string} - The actual display_value to show.
 *       - `.run`: {@link function} - The actual expression to execute upon running it in non-preview mode.
 *       - `.value`: {@link any} - If a filter, it should return an {@link Array}<{@link any}>.
 *     -
 *     - `.options`: {@link Object}
 *       - `.alluvial_scaling=1`: {@link number} - How much to scale alluvial widths by when displayed compared to their actual number.
 *   	   - `.id=Class.generateRandomID(ve.NodeEditorDatatype)`: {@link string} - The ID to assign to the present datatype at a class level.
 *       - `.show_alluvial=false`: {@link boolean}
 *   - `.project_folder`: {@link string}
 *
 * ##### Instance:
 * - `.id`: {@link string}
 * - `.main`: {@link Object}
 *   - `.variables`: {@link Object} - Where values during the run-cycle are stored.
 * - `.map`: {@link maptalks.Map} - Not an actual map instance. Used for rendering the node environment in 3D space.
 * - `.node_layer`: {@link maptalks.VectorLayer}
 * - `.v`: {@link Object}
 *
 * ##### Methods:
 * - <span color=00ffff>{@link ve.NodeEditor._connect|_connect}</span>(arg0_node:{@link ve.NodeEditorDatatype}, arg1_node:{@link ve.NodeEditorDatatype}, arg2_index:{@link number}, arg3_options:{@link Object})
 * - <span color=00ffff>{@link ve.NodeEditor._disconnect|_disconnect}</span>(arg0_node:{@link ve.NodeEditorDatatype}, arg1_node:{@link ve.NodeEditorDatatype}, arg2_index:{@link number})
 * - <span color=00ffff>{@link ve.NodeEditor._select|_select}</span>(arg0_node:{@link ve.NodeEditorDatatype}, arg1_index:{@link number})
 *
 * - <span color=00ffff>{@link ve.NodeEditor.clear|clear}</span>()
 * - <span color=00ffff>{@link ve.NodeEditor.drawToolbox|drawToolbox}</span>()
 * - <span color=00ffff>{@link ve.NodeEditor.getCanvas|getCanvas}</span>() | {@link HTMLCanvasElement}
 * - <span color=00ffff>{@link ve.NodeEditor.getDAGSequence|getDAGSequence}</span>() | {@link Array}<{@link Array}<{@link ve.NodeEditorDatatype}>>
 * - <span color=00ffff>{@link ve.NodeEditor.getDefaultBaseLayer|getDefaultBaseLayer}</span>() | {@link Object}
 * - <span color=00ffff>{@link ve.NodeEditor.loadSettings|loadSettings}</span>(arg0_settings:{@link Object})
 * - async <span color=00ffff>{@link ve.NodeEditor.run|run}</span>(arg0_preview_mode:{@link boolean}) | {@link Object}
 *
 * @augments ve.Component
 * @memberof ve.Component
 * @type {ve.NodeEditor}
 */
ve.NodeEditor = class extends ve.Component { //[WIP] - How do we handle iterations so that sub-nodes are aware of their current iteration index? By making for loop nodes return their current iteration value.
	/**
	 * @type {ve.NodeEditor[]}
	 */
	static instances = [];
	
	constructor(arg0_value, arg1_options) {
		//Convert from parameters
		let options = arg1_options ? arg1_options : {};
		let value = arg0_value;
		super(options);
		
		//Declare local instance variables
		options.attributes = options.attributes ? options.attributes : {};
		options.category_types = options.category_types ? options.category_types : {};
		options.node_types = options.node_types ? options.node_types : {};
		options.polling = Math.returnSafeNumber(options.polling, 100);
		options.style = {
			height: "50vh",
			width: "50vw",
			"#map-container": { height: "100%", width: "100%" },
			".maptalks-all-layers, .maptalks-canvas-layer, .maptalks-wrapper": {
				position: "static",
			},
			".maptalks-attribution": { display: "none" },
			...options.style,
		};
		
		if (!options.category_types["Config"])
			options.category_types["Config"] = {
				colour: [70, 70, 90],
				text_colour: [200, 200, 255],
			};
		if (!options.category_types["Custom"])
			options.category_types["Custom"] = {
				colour: [100, 50, 150],
				text_colour: [255, 255, 255],
			};
		if (!options.category_types["I/O"])
			options.category_types["I/O"] = {
				colour: [50, 50, 50],
				text_colour: [255, 255, 255],
			};
		
		if (
			ve.NodeEditor.Forse &&
			typeof ve.NodeEditor.Forse.getForseObject === "function" &&
			!options.disable_forse
		) {
			let forse_data = ve.NodeEditor.Forse.getForseObject();
			if (forse_data.category_types)
				options.category_types = {
					...forse_data.category_types,
					...options.category_types,
				};
			if (forse_data.node_types)
				options.node_types = { ...forse_data.node_types, ...options.node_types };
		}
		
		options.node_types = {
			...options.node_types,
			ve_config_category: {
				name: "Node Category",
				category: "Config",
				input_parameters: [{ name: "Category", type: "string" }],
				is_internal: true,
				output_type: "string",
				special_function: (val) => {
					return { value: val };
				},
			},
			ve_config_name: {
				name: "Node Name",
				category: "Config",
				input_parameters: [{ name: "Name", type: "string" }],
				is_internal: true,
				output_type: "string",
				special_function: (val) => {
					return { value: val };
				},
			},
			ve_config_output_type: {
				name: "Node Output Type",
				category: "Config",
				input_parameters: [{ name: "Type", type: "string" }],
				is_internal: true,
				output_type: "string",
				special_function: (val) => {
					return { value: val };
				},
			},
			ve_input: {
				name: "Input",
				category: "I/O",
				input_parameters: [
					{ name: "Name", type: "string" },
					{ name: "Type", type: "string" },
				],
				is_internal: true,
				output_type: "any",
				special_function: function (p_name, p_type, context_node) {
					return {
						value: context_node ? context_node.runtime_value : undefined,
					};
				},
			},
			ve_output: {
				name: "Output",
				category: "I/O",
				input_parameters: [{ name: "Result", type: "any" }],
				is_internal: true,
				output_type: "any",
				special_function: (arg) => {
					return { value: arg };
				},
			},
			ve_comment: {
				name: "Comment",
				category: "I/O",
				input_parameters: [],
				options: { is_comment: true },
				output_type: "none",
			},
		};
		
		this.element = document.createElement("div");
		this.element.instance = this;
		this.element.setAttribute("component", "ve-node-editor");
		HTML.setAttributesObject(this.element, options.attributes);
		
		this.map_el = document.createElement("div");
		this.map_el.id = "map-container";
		this.element.appendChild(this.map_el);
		
		if (ve.registry.debug_mode) {
			let debug_button = new ve.Button(
				() => {
					console.log(this.getDAGSequence());
				},
				{ name: "Debug" },
			);
			debug_button.bind(this.element);
		}
		
		let run_button = new ve.Button(
			() => {
				this.run().then(() => ve.NodeEditorDatatype.draw(this));
			},
			{ name: "Run" },
		);
		run_button.bind(this.element);
		
		this.id = Class.generateRandomID(ve.NodeEditor);
		this.map = new maptalks.Map(this.map_el, {
			center: [0, 0],
			zoom: 14,
			baseLayer: this.getDefaultBaseLayer(),
		});
		
		this.node_layer = new maptalks.VectorLayer("nodes", [], {
			hitDetect: true,
		});
		this.node_layer.addTo(this.map);
		this.options = options;
		
		this.main = {
			custom_node_types: {},
			nodes: [],
			settings: {
				display_expressions_with_values: true,
				display_filters_as_alluvial: true,
				display_filters_with_numbers: true,
			},
			user: { selected_nodes: [] },
			variables: {},
		};
		
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
		
		this.v = value;
		ve.NodeEditor.instances.push(this);
	}
	
	/**
	 * Returns the current JSON object from the component.
	 *
	 * @alias v
	 * @memberof ve.Component.ve.NodeEditor
	 * @type {Object}
	 */
	get v() {
		//Return statement
		return {
			custom_node_types: this.main.custom_node_types,
			map_state: {
				center: this.map.getCenter().toArray(),
				zoom: this.map.getZoom(),
			},
			nodes: this.main.nodes.map((node) => node.v),
			settings: this.main.settings,
		};
	}
	
	/**
	 * Sets the current value of the ve.NodeEditor from available JSON.
	 *
	 * @alias v
	 * @memberof ve.Component.ve.NodeEditor
	 * @param {Object} arg0_value
	 */
	set v(arg0_value) {
		//Convert from parameters
		let data =
			typeof arg0_value === "string" ? JSON.parse(arg0_value) : arg0_value;
		
		//Declare local instance variables
		if (!data) return;
		this.clear();
		
		if (data.map_state) {
			this.map.setCenter(data.map_state.center);
			this.map.setZoom(data.map_state.zoom);
		}
		
		if (data.custom_node_types) {
			this.main.custom_node_types = data.custom_node_types;
			Object.keys(this.main.custom_node_types).forEach((key) => {
				let def = this.main.custom_node_types[key];
				if (def.subgraph) {
					def.special_function = this._createCustomExecutionLogic(def.subgraph);
				}
			});
			this.options.node_types = {
				...this.options.node_types,
				...this.main.custom_node_types,
			};
		}
		
		if (data.nodes && Array.isArray(data.nodes)) {
			data.nodes.forEach((node_data) => {
				let definition = this.options.node_types[node_data.key];
				if (definition) {
					let category_options =
						this.options.category_types[definition.category] || {};
					let new_node = new ve.NodeEditorDatatype(
						{
							...definition,
							...node_data,
						},
						{
							category_options: category_options,
							node_editor: this,
							...definition.options,
						},
					);
					this.main.nodes.push(new_node);
				} else {
					console.warn(
						`Node type '${node_data.key}' not found in registry. Skipping node.`,
					);
				}
			});
			
			this.main.nodes.forEach((node) => {
				if (node._serialised_connections) {
					node.connections = [];
					node._serialised_connections.forEach(([target_id, target_index]) => {
						// FIX: Pass 'this' to getNode to scope lookup to this editor
						let target_node = ve.NodeEditorDatatype.getNode(target_id, this);
						if (target_node) {
							node.connections.push([target_node, target_index]);
							if (target_index > 0)
								target_node.dynamic_values[target_index - 1] = true;
						}
					});
					delete node._serialised_connections;
				}
			});
		}
		
		if (data.settings)
			this.main.settings = { ...this.main.settings, ...data.settings };
		
		ve.NodeEditorDatatype.draw(this);
	}
	
	loadSettings(arg0_settings) {}
};

/**
 * Functional binding for ve.NodeEditor.
 */
veNodeEditor = function () {
	return new ve.NodeEditor(...arguments);
};