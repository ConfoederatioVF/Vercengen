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
	
	/**
	 * Draws a connection between two nodes as a user interaction.
	 *
	 * @alias _connect
	 * @memberof ve.Component.ve.NodeEditor
	 * @param {ve.NodeEditorDatatype} arg0_node
	 * @param {ve.NodeEditorDatatype} arg1_node
	 * @param {number} arg2_index
	 * @param {Object} [arg3_options]
	 * @private
	 */
	_connect(arg0_node, arg1_node, arg2_index, arg3_options) {
		//Convert from parameters
		let index = arg2_index;
		let node = arg0_node;
		let options = arg3_options ? arg3_options : {};
		let ot_node = arg1_node;
		
		//Declare local instance variables
		if (node.getConnection(ot_node, index) !== -1) {
			if (options.toggle_connection) {
				this._disconnect(node, ot_node, index);
				return;
			} else {
				return;
			}
		}
		
		node.connections.push([ot_node, index]);
		let dag_sequence = this.getDAGSequence();
		
		if (dag_sequence === undefined) {
			node.connections.pop();
			veToast(`<icon>warning</icon> Circular dependencies are not allowed.`);
			return;
		}
		
		if (index > 0) {
			let input_type = ot_node.value.input_parameters[index - 1].type
				? ot_node.value.input_parameters[index - 1].type
				: "any";
			let output_type = node.value.output_type ? node.value.output_type : "any";
			
			if (input_type !== output_type && input_type !== "any") {
				node.connections.pop();
				veToast(
					`<icon>warning</icon> ${output_type} to ${input_type} are not of the same types.`,
				);
				return;
			}
		}
		
		if (index > 0) ot_node.dynamic_values[index - 1] = true;
		ve.NodeEditorDatatype.draw(this);
	}
	
	/**
	 * Generates logic for custom nodes.
	 * @private
	 */
	_createCustomExecutionLogic(subgraph) {
		//Convert from parameters
		let parent_options = this.options;
		
		//Return statement
		return async function (...args) {
			let sub_editor = new ve.NodeEditor(subgraph, {
				...parent_options,
				headless: true,
				show_internal: true,
			});
			
			let sub_inputs = sub_editor.main.nodes.filter(
				(n) => n.value.key === "ve_input",
			);
			sub_inputs.sort((a, b) => a.value.coords.y - b.value.coords.y);
			
			for (let i = 0; i < sub_inputs.length; i++) {
				if (args[i] !== undefined) {
					sub_inputs[i].runtime_value = args[i];
				}
			}
			
			let results = await sub_editor.run(false);
			let sub_output = sub_editor.main.nodes.find(
				(n) => n.value.key === "ve_output",
			);
			let return_val = sub_output ? results[sub_output.id] : undefined;
			
			sub_editor.clear();
			return { value: return_val };
		};
	}
	
	/**
	 * Deletes a custom node definition.
	 * @private
	 */
	_deleteCustomNode(arg0_key) {
		let key = arg0_key;
		
		if (this.main.custom_node_types[key]) {
			delete this.main.custom_node_types[key];
			delete this.options.node_types[key];
			
			if (this.toolbox_window) {
				this.toolbox_window.close();
				this.drawToolbox();
			}
			
			veToast("Custom Node Deleted.");
		}
	}
	
	/**
	 * Disconnects two nodes.
	 * @private
	 */
	_disconnect(arg0_node, arg1_node, arg2_index) {
		//Convert from parameters
		let index = arg2_index;
		let node = arg0_node;
		let ot_node = arg1_node;
		
		//Declare local instance variables
		let node_connection_index = node.getConnection(ot_node, index);
		
		if (node_connection_index !== -1) {
			node.connections.splice(node_connection_index, 1);
			if (index > 0) ot_node.dynamic_values[index - 1] = undefined;
			ve.NodeEditorDatatype.draw(this);
		}
	}
	
	/**
	 * Opens custom node editor window. Can optionally edit an existing node.
	 * @private
	 * @param {string} [arg0_edit_key] - If provided, edits the existing custom node with this key.
	 */
	_openCustomNodeEditor(arg0_edit_key) {
		//Declare local instance variables
		let edit_key = arg0_edit_key;
		let existing_def = edit_key ? this.main.custom_node_types[edit_key] : null;
		
		let custom_node_window;
		let temp_editor = new ve.NodeEditor(
			{ nodes: [] },
			{
				category_types: this.options.category_types,
				node_types: this.options.node_types,
				project_folder: this.options.project_folder,
				show_internal: true,
			},
		);
		
		let save_custom_node = () => {
			let active_input_nodes = temp_editor.main.nodes.filter(
				(n) => n.value.key === "ve_input",
			);
			let graph_data = temp_editor.v;
			let nodes = graph_data.nodes;
			
			active_input_nodes.sort((a, b) => a.value.coords.y - b.value.coords.y);
			let inputs = active_input_nodes.map((n, i) => {
				let param_name =
					n.constant_values && n.constant_values[0]
						? n.constant_values[0]
						: `Param ${i + 1}`;
				let param_type =
					n.constant_values && n.constant_values[1]
						? n.constant_values[1]
						: "any";
				return { name: param_name, type: param_type };
			});
			
			let meta_category = "Custom";
			let meta_name = existing_def ? existing_def.name : "New Custom Node";
			let meta_output_type = "any";
			
			let n_cat = nodes.find((n) => n.key === "ve_config_category");
			if (n_cat && n_cat.constant_values[0])
				meta_category = n_cat.constant_values[0];
			
			let n_name = nodes.find((n) => n.key === "ve_config_name");
			if (n_name && n_name.constant_values[0])
				meta_name = n_name.constant_values[0];
			
			let n_out_type = nodes.find((n) => n.key === "ve_config_output_type");
			if (n_out_type && n_out_type.constant_values[0])
				meta_output_type = n_out_type.constant_values[0];
			
			let output_node = nodes.find((n) => n.key === "ve_output");
			if (!output_node) {
				veToast("Custom Node must have an 'Output' node.");
				return;
			}
			
			let node_key =
				edit_key || `custom_${Class.generateRandomID(ve.NodeEditor)}`;
			
			let custom_definition = {
				name: meta_name,
				category: meta_category,
				input_parameters: inputs,
				output_type: meta_output_type,
				options: {
					id: existing_def
						? existing_def.options.id
						: Class.generateRandomID(ve.NodeEditorDatatype),
					alluvial_scaling: 1,
					show_alluvial: false,
				},
				subgraph: graph_data,
				special_function: this._createCustomExecutionLogic(graph_data),
			};
			
			this.main.custom_node_types[node_key] = custom_definition;
			this.options.node_types[node_key] = custom_definition;
			
			if (this.toolbox_window) {
				this.toolbox_window.close();
				this.drawToolbox();
			}
			
			custom_node_window.close();
			veToast(
				`Custom Node '${meta_name}' ${existing_def ? "Updated" : "Created"}.`,
			);
		};
		
		let window_contents = new ve.RawInterface(
			{
				editor_panel: new ve.RawInterface(
					{ editor: temp_editor },
					{ style: { width: "100%", height: "calc(100% - 3rem)" } },
				),
				controls: new ve.RawInterface(
					{
						save_btn: new ve.Button(save_custom_node, {
							name: existing_def ? "Update Custom Node" : "Save Custom Node",
							style: { width: "100%", height: "100%" },
						}),
					},
					{ style: { height: "3rem", padding: "0.5rem" } },
				),
			},
			{ style: { display: "flex", flexDirection: "column", height: "100%" } },
		);
		
		custom_node_window = new ve.Window(window_contents, {
			name: existing_def ? `Edit ${existing_def.name}` : "Create Custom Node",
			width: "80vw",
			height: "80vh",
			can_rename: false,
		});
		
		// Ensure map is ready and interactive before loading nodes
		setTimeout(() => {
			if (temp_editor.map) {
				temp_editor.map.checkSize();
				// Ensure center is valid to prevent rendering glitches
				if (existing_def && existing_def.subgraph.map_state) {
					temp_editor.map.setCenter(existing_def.subgraph.map_state.center);
					temp_editor.map.setZoom(existing_def.subgraph.map_state.zoom);
				}
			}
			
			if (existing_def && existing_def.subgraph)
				temp_editor.v = existing_def.subgraph;
			ve.NodeEditorDatatype.draw(temp_editor);
		}, 100);
	}
	
	/**
	 * Selects a node index.
	 * @private
	 */
	_select(arg0_node, arg1_index) {
		//Convert from parameters
		let index = arg1_index;
		let node = arg0_node;
		
		//Declare local instance variables
		let selected_nodes = this.main.user.selected_nodes;
		
		for (let i = selected_nodes.length - 1; i >= 0; i--) {
			if (
				selected_nodes[i][0].id === node.id &&
				selected_nodes[i][1] === index
			) {
				this.main.user.selected_nodes.splice(i, 1);
				ve.NodeEditorDatatype.draw(this);
				return;
			} else if (selected_nodes[i][0].id === node.id) {
				this.main.user.selected_nodes.splice(i, 1);
				continue;
			}
		}
		
		if (selected_nodes.length >= 1)
			if (selected_nodes[0][1] > 0 && index > 0) return;
		
		selected_nodes.push([node, index]);
		
		if (selected_nodes.length >= 2) {
			this._connect(
				selected_nodes[0][0],
				selected_nodes[1][0],
				selected_nodes[1][1],
				{
					toggle_connection: true,
				},
			);
			selected_nodes = [];
		}
		
		this.main.user.selected_nodes = selected_nodes;
		ve.NodeEditorDatatype.draw(this);
	}
	
	/**
	 * Clears all nodes.
	 */
	clear() {
		//Declare local instance variables
		if (this.node_layer) this.node_layer.clear();
		
		for (let i = this.main.nodes.length - 1; i >= 0; i--)
			this.main.nodes[i].remove();
		
		this.main.nodes = [];
		this.main.user.selected_nodes = [];
		this.main.variables = {};
	}
	
	drawToolbox() {
		let page_menu_obj = {};
		let unique_categories = [];
		
		Object.iterate(this.options.node_types, (local_key, local_value) => {
			if (typeof local_value !== "object" || !local_value) return;
			if (local_value.is_internal && !this.options.show_internal) return;
			
			let category = local_value.category || "Uncategorised";
			if (!unique_categories.includes(category))
				unique_categories.push(category);
		});
		
		if (unique_categories.length === 0)
			unique_categories = ["Expressions", "Filters", "I/O", "Custom"];
		if (!this.options.exclude_all) unique_categories.unshift("All");
		
		for (let i = 0; i < unique_categories.length; i++) {
			let category_key = unique_categories[i];
			let filter_names_obj = {};
			let local_search_select_obj = {};
			
			for (let x = 0; x < unique_categories.length; x++)
				filter_names_obj[
					`data-${unique_categories[x]
					.toLowerCase()
					.replace(/[^a-z0-9]/g, "_")}`
					] = unique_categories[x];
			
			Object.iterate(this.options.node_types, (local_key, local_value) => {
				if (typeof local_value !== "object" || !local_value) return;
				if (local_value.is_internal && !this.options.show_internal) return;
				
				let local_category = local_value.category || "Uncategorised";
				let local_category_options =
					this.options.category_types[local_category] || {};
				
				let local_category_colour = Colour.convertRGBAToHex(
					local_category_options.colour || [255, 255, 255],
				);
				let local_category_text_colour = Colour.convertRGBAToHex(
					local_category_options.text_colour || [0, 0, 0],
				);
				
				if (local_category === category_key || category_key === "All") {
					let toolbox_button = new ve.Button(
						() => {
							if (local_key === "ve_comment") {
								let comment_window_components = {
									text_input: new ve.Text("", {
										placeholder: "Enter comment...",
									}),
								};
								
								comment_window_components.confirm = new ve.Button(
									(e) => {
										let comment_text = comment_window_components.text_input.v;
										this.main.nodes.push(
											new ve.NodeEditorDatatype(
												{
													coords: this._mouse_coords,
													key: local_key,
													name: comment_text,
													...local_value,
												},
												{
													category_options: local_category_options,
													node_editor: this,
													...local_value.options,
												},
											),
										);
										if (this.current_comment_window)
											this.current_comment_window.close();
									},
									{ name: "Place Comment" },
								);
								
								this.current_comment_window = new ve.Window(
									comment_window_components,
									{ name: "Add Comment", width: "20rem", height: "auto" },
								);
								return;
							}
							
							this.main.nodes.push(
								new ve.NodeEditorDatatype(
									{
										coords: this._mouse_coords,
										key: local_key,
										...local_value,
									},
									{
										category_options: local_category_options,
										node_editor: this,
										...local_value.options,
									},
								),
							);
						},
						{
							attributes: {
								[`data-${local_category
								.toLowerCase()
								.replace(/[^a-z0-9]/g, "_")}`]: "true",
							},
							name: local_value.name ? local_value.name : local_key,
							style: {
								button: {
									backgroundColor: local_category_colour,
									color: local_category_text_colour,
								},
							},
						},
					);
					
					if (
						local_category === "Custom" &&
						this.main.custom_node_types[local_key]
					) {
						setTimeout(() => {
							if (toolbox_button.element) {
								toolbox_button.element.addEventListener("contextmenu", (e) => {
									e.preventDefault();
									new ve.ContextMenu(
										{
											edit_node: new ve.Button(
												() => {
													this._openCustomNodeEditor(local_key);
												},
												{ name: "<icon>edit</icon> Edit Node" },
											),
											delete_node: new ve.Button(
												() => {
													this._deleteCustomNode(local_key);
												},
												{ name: "<icon>delete</icon> Delete Node" },
											),
										},
										{
											x: e.clientX,
											y: e.clientY,
										},
									);
								});
							}
						}, 0);
					}
					
					local_search_select_obj[local_key] = toolbox_button;
				}
			});
			
			if (category_key === "Custom" || category_key === "All")
				local_search_select_obj["create_custom"] = new ve.Button(
					() => {
						this._openCustomNodeEditor();
					},
					{
						name: "<icon>add_circle</icon> Create Custom Node",
						style: {
							button: {
								border: "1px dashed var(--body-colour)",
								display: "block",
								marginTop: "var(--padding)",
							},
						},
					},
				);
			
			page_menu_obj[category_key] = {
				name: category_key,
				components_obj: {
					search_select: new ve.SearchSelect(local_search_select_obj, {
						hide_filter: category_key !== "All",
						filter_names: filter_names_obj,
					}),
				},
			};
		}
		
		if (this.toolbox_window) this.toolbox_window.close();
		this.toolbox_window = new ve.PageMenuWindow(page_menu_obj, {
			name: "Toolbox",
			height: "40vh",
			width: "23rem",
			can_rename: false,
		});
	}
	
	getCanvas() {
		if (!this._canvas) this._canvas = document.createElement("canvas");
		return this._canvas;
	}
	
	getDAGSequence() {
		let adjacency = new Map();
		let in_degree = new Map();
		let nodes = ve.NodeEditorDatatype.instances.filter(
			(local_node) => local_node.options.node_editor === this,
		);
		
		for (let i = 0; i < nodes.length; i++) {
			in_degree.set(nodes[i].id, 0);
			adjacency.set(nodes[i].id, new Set());
		}
		
		for (let i = 0; i < nodes.length; i++)
			for (let x = 0; x < nodes[i].connections.length; x++) {
				let local_target_node = nodes[i].connections[x][0];
				if (!in_degree.has(local_target_node.id)) continue;
				
				if (!adjacency.get(nodes[i].id).has(local_target_node.id)) {
					adjacency.get(nodes[i].id).add(local_target_node.id);
					in_degree.set(
						local_target_node.id,
						in_degree.get(local_target_node.id) + 1,
					);
				}
			}
		
		let layers = [];
		let processed_count = 0;
		let queue = [];
		
		for (let i = 0; i < nodes.length; i++)
			if (in_degree.get(nodes[i].id) === 0) queue.push(nodes[i]);
		
		while (queue.length > 0) {
			let layer = [];
			let next_queue = [];
			
			for (let i = 0; i < queue.length; i++) {
				layer.push(queue[i]);
				processed_count++;
				
				let edges = adjacency.get(queue[i].id);
				if (!edges) continue;
				
				edges.forEach((to_id) => {
					in_degree.set(to_id, in_degree.get(to_id) - 1);
					if (in_degree.get(to_id) === 0)
						next_queue.push(ve.NodeEditorDatatype.getNode(to_id, this));
				});
			}
			layers.push(layer);
			queue = next_queue;
		}
		
		if (processed_count !== nodes.length) return undefined;
		return layers;
	}
	
	getDefaultBaseLayer() {
		let base_layer = new maptalks.TileLayer("base", {
			urlTemplate: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
			subdomains: ["a", "b", "c"],
			repeatWorld: true,
		});
		
		base_layer.getBase64Image = (arg0_image) => {
			let img = arg0_image;
			let canvas = this.getCanvas();
			canvas.height = img.height;
			canvas.width = img.width;
			let ctx = canvas.getContext("2d");
			
			if (this.options.bg_ctx) {
				ctx = this.options.bg_ctx(ctx);
			} else {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(img, 0, 0);
				ctx.fillStyle = `rgba(25, 25, 25, 1)`;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.save();
				ctx.strokeStyle = `rgba(255, 255, 255, 0.5)`;
				ctx.lineWidth = 1;
				
				let columns = 8;
				let rows = 8;
				let cell_height = canvas.height / rows;
				let cell_width = canvas.width / columns;
				
				for (let i = 0; i <= columns; i++) {
					let local_x = i * cell_width;
					ctx.beginPath();
					ctx.moveTo(local_x, 0);
					ctx.lineTo(local_x, canvas.height);
					ctx.stroke();
				}
				
				for (let i = 0; i <= rows; i++) {
					let local_y = i * cell_height;
					ctx.beginPath();
					ctx.moveTo(0, local_y);
					ctx.lineTo(canvas.width, local_y);
					ctx.stroke();
				}
				ctx.restore();
			}
			
			return canvas.toDataURL("image/jpg", 0.7);
		};
		
		base_layer.getTileUrl = function (x, y, z) {
			return maptalks.TileLayer.prototype.getTileUrl.call(this, x, y, z);
		};
		
		base_layer.on("renderercreate", (e) => {
			e.renderer.loadTileImage = (arg0_image, arg1_url) => {
				let img = arg0_image;
				let url = arg1_url;
				let remote_image = new Image();
				remote_image.crossOrigin = "anonymous";
				remote_image.onload = () =>
					(img.src = base_layer.getBase64Image(remote_image));
				remote_image.src = url;
			};
		});
		
		return base_layer;
	}
	
	loadSettings(arg0_settings) {}
	
	async run(arg0_preview_mode) {
		if (this._is_running) return this.main.variables;
		this._is_running = true;
		
		try {
			let dag_sequence = this.getDAGSequence();
			let preview_mode = arg0_preview_mode;
			this.main.variables = {};
			this.main.skipped_nodes = new Set();
			this.main.node_iterations = {}; // Track branch iteration counts
			
			let resolve_arguments = (arg0_node, iteration_index = 0) => {
				let args = [];
				let node = arg0_node;
				
				if (node.value.input_parameters)
					for (let i = 0; i < node.value.input_parameters.length; i++) {
						let local_parameter = node.value.input_parameters[i];
						
						if (node.dynamic_values[i]) {
							let resolved;
							for (let x = 0; x < ve.NodeEditorDatatype.instances.length; x++) {
								let source = ve.NodeEditorDatatype.instances[x];
								if (source.options.node_editor !== this) continue;
								for (let y = 0; y < source.connections.length; y++) {
									let target_data = source.connections[y];
									if (target_data[0].id === node.id && target_data[1] === i + 1) {
										let source_val = this.main.variables[source.id];
										let source_iters = this.main.node_iterations[source.id] || 1;
										
										// Pick specific value for this iteration, or fallback to scalar
										resolved =
											Array.isArray(source_val) && source_iters > 1
												? source_val[iteration_index % source_iters]
												: source_val;
										break;
									}
								}
								if (resolved !== undefined) break;
							}
							args.push(resolved);
						} else if (node.constant_values[i] !== undefined) {
							args.push(node.constant_values[i]);
						} else {
							let local_type = JSON.parse(JSON.stringify(local_parameter.type));
							if (ve.NodeEditorDatatype.types[local_type] === undefined)
								local_type = "any";
							args.push(ve.NodeEditorDatatype.types[local_type]);
						}
					}
				return args;
			};
			
			for (let i = 0; i < dag_sequence.length; i++) {
				let layer = dag_sequence[i];
				
				if (!preview_mode)
					for (let x = 0; x < layer.length; x++) {
						delete layer[x].ui.information.status;
						layer[x].draw();
					}
				
				await Promise.all(
					layer.map(async (local_node) => {
						// Determine if we are inside an iterating branch by checking parents
						let max_iters = 1;
						for (let inst of ve.NodeEditorDatatype.instances) {
							if (inst.options.node_editor !== this) continue;
							for (let conn of inst.connections) {
								if (conn[0].id === local_node.id) {
									max_iters = Math.max(
										max_iters,
										this.main.node_iterations[inst.id] || 1,
									);
								}
							}
						}
						
						let results = [];
						let last_descriptor;
						let is_aborted = false;
						
						// Run the branch logic N times
						for (let iter = 0; iter < max_iters; iter++) {
							let args = resolve_arguments(local_node, iter);
							let sf = local_node.value.special_function;
							let descriptor, value;
							
							try {
								descriptor =
									typeof sf === "function"
										? await sf.call(this, ...args, local_node)
										: sf;
								
								if (descriptor && descriptor.abort === true) {
									is_aborted = true;
									break;
								}
								
								value =
									descriptor && typeof descriptor === "object"
										? descriptor.value
										: descriptor;
								
								if (
									!preview_mode &&
									descriptor &&
									typeof descriptor.run === "function"
								) {
									local_node.ui.information.status = "is_running";
									local_node.draw();
									await descriptor.run();
								}
								results.push(value);
								last_descriptor = descriptor;
							} catch (e) {
								console.error(`Execution failed (${local_node.id})`, e);
								is_aborted = true;
								break;
							}
						}
						
						if (is_aborted) {
							this.main.skipped_nodes.add(local_node.id);
							local_node.ui.information.status = "aborted";
						} else {
							// Check if this node triggers a new iteration count for its branch
							let explicit_iters = Math.returnSafeNumber(
								last_descriptor?.iterations,
								0,
							);
							
							if (explicit_iters > 0) {
								this.main.node_iterations[local_node.id] = explicit_iters;
								// FIX: Instead of .fill(), run remaining iterations to generate unique values
								for (let j = 1; j < explicit_iters; j++) {
									let args = resolve_arguments(local_node, j);
									let sf = local_node.value.special_function;
									let descriptor = await sf.call(this, ...args, local_node);
									results.push(
										descriptor && typeof descriptor === "object"
											? descriptor.value
											: descriptor,
									);
								}
								this.main.variables[local_node.id] = results;
							} else {
								this.main.node_iterations[local_node.id] = max_iters;
								this.main.variables[local_node.id] =
									max_iters > 1 ? results : results[0];
							}
							local_node.ui.information.status = "finished";
						}
						
						if (!preview_mode) {
							local_node.ui.information.alluvial_width = Math.returnSafeNumber(
								last_descriptor?.alluvial_width,
								1,
							);
							local_node.ui.information.value =
								last_descriptor?.display_value !== undefined
									? last_descriptor.display_value
									: this.main.variables[local_node.id];
							local_node.draw();
						}
					}),
				);
			}
		} finally {
			this._is_running = false;
		}
		
		return this.main.variables;
	}
};

/**
 * Functional binding for ve.NodeEditor.
 */
veNodeEditor = function () {
	return new ve.NodeEditor(...arguments);
};