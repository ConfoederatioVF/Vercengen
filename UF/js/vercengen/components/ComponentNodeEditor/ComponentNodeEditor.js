/**
 * Refer to ve.Component for methods or fields inherited from this Component's parent.
 *
 * Creates a drag-and-drop Node Editor using Maptalks as a backend.
 * - Functional binding: veNodeEditor().
 */
ve.NodeEditor = class extends ve.Component {
	/**
	 * @type {ve.NodeEditor[]}
	 */
	static instances = [];
	
	constructor(arg0_value, arg1_options) {
		// Convert from parameters
		let value = arg0_value;
		let options = arg1_options ? arg1_options : {};
		super(options);
		
		// Initialise options
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
		
		// Set default categories
		if (!options.category_types["I/O"])
			options.category_types["I/O"] = {
				colour: [50, 50, 50],
				text_colour: [255, 255, 255],
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
		
		// Merge Default DSL (Forse)
		if (
			ve.NodeEditor.Forse &&
			typeof ve.NodeEditor.Forse.getForseObject === "function"
		) {
			let forse_data = ve.NodeEditor.Forse.getForseObject();
			if (forse_data.node_types)
				options.node_types = { ...forse_data.node_types, ...options.node_types };
			if (forse_data.category_types)
				options.category_types = {
					...forse_data.category_types,
					...options.category_types,
				};
		}
		
		// Merge Built-in Nodes
		options.node_types = {
			...options.node_types,
			ve_input: {
				name: "Input",
				category: "I/O",
				output_type: "any",
				input_parameters: [
					{ name: "Name", type: "string" },
					{ name: "Type", type: "string" },
				],
				special_function: function (p_name, p_type, context_node) {
					return {
						value: context_node ? context_node.runtime_value : undefined,
					};
				},
			},
			ve_output: {
				name: "Output",
				category: "I/O",
				output_type: "any",
				input_parameters: [{ name: "Result", type: "any" }],
				special_function: (arg) => {
					return { value: arg };
				},
			},
			ve_comment: {
				name: "Comment",
				category: "I/O",
				input_parameters: [],
				output_type: "none",
				options: { is_comment: true },
			},
			ve_config_name: {
				name: "Node Name",
				category: "Config",
				output_type: "string",
				input_parameters: [{ name: "Name", type: "string" }],
				special_function: (val) => {
					return { value: val };
				},
			},
			ve_config_category: {
				name: "Node Category",
				category: "Config",
				output_type: "string",
				input_parameters: [{ name: "Category", type: "string" }],
				special_function: (val) => {
					return { value: val };
				},
			},
			ve_config_output_type: {
				name: "Node Output Type",
				category: "Config",
				output_type: "string",
				input_parameters: [{ name: "Type", type: "string" }],
				special_function: (val) => {
					return { value: val };
				},
			},
		};
		
		// Declare local instance variables
		this.element = document.createElement("div");
		this.element.setAttribute("component", "ve-node-editor");
		HTML.setAttributesObject(this.element, options.attributes);
		this.element.instance = this;
		
		this.map_el = document.createElement("div");
		this.map_el.id = "map-container";
		this.element.appendChild(this.map_el);
		
		if (ve.registry.debug_mode) {
			let debug_button = new ve.Button(() => {
				console.log(this.getDAGSequence());
			}, { name: "Debug" });
			debug_button.bind(this.element);
		}
		let run_button = new ve.Button(() => {
			this.run().then(() => ve.NodeEditorDatatype.draw());
		}, { name: "Run" });
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
			nodes: [],
			custom_node_types: {},
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
		
		this.value = value;
		this.v = this.value;
		ve.NodeEditor.instances.push(this);
	}
	
	get v() {
		return {
			settings: this.main.settings,
			custom_node_types: this.main.custom_node_types,
			nodes: this.main.nodes.map((node) => node.v),
		};
	}
	
	set v(arg0_value) {
		let data =
			typeof arg0_value === "string" ? JSON.parse(arg0_value) : arg0_value;
		if (!data) return;
		
		this.clear();
		
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
							coords: node_data.coords,
							key: node_data.key,
							...definition,
						},
						{
							category_options: category_options,
							node_editor: this,
							...definition.options,
						},
					);
					new_node.v = node_data;
					this.main.nodes.push(new_node);
				}
			});
			
			this.main.nodes.forEach((node) => {
				if (node._serialised_connections) {
					node.connections = [];
					node._serialised_connections.forEach(([target_id, target_index]) => {
						let target_node = ve.NodeEditorDatatype.getNode(target_id);
						if (target_node) {
							node.connections.push([target_node, target_index]);
							if (target_index > 0) target_node.dynamic_values[target_index - 1] = true;
						}
					});
					delete node._serialised_connections;
				}
			});
		}
		
		if (data.settings)
			this.main.settings = { ...this.main.settings, ...data.settings };
		
		ve.NodeEditorDatatype.draw();
	}
	
	_connect(arg0_node, arg1_node, arg2_index, arg3_options) {
		let node = arg0_node;
		let ot_node = arg1_node;
		let index = arg2_index;
		let options = arg3_options ? arg3_options : {};
		
		if (node.getConnection(ot_node, index) !== -1)
			if (options.toggle_connection) {
				this._disconnect(node, ot_node, index);
				return;
			} else {
				return;
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
		ve.NodeEditorDatatype.draw();
	}
	
	_disconnect(arg0_node, arg1_node, arg2_index) {
		let node = arg0_node;
		let ot_node = arg1_node;
		let index = arg2_index;
		let node_connection_index = node.getConnection(ot_node, index);
		
		if (node_connection_index !== -1) {
			node.connections.splice(node_connection_index, 1);
			if (index > 0) ot_node.dynamic_values[index - 1] = undefined;
			ve.NodeEditorDatatype.draw();
		}
	}
	
	_select(arg0_node, arg1_index) {
		let node = arg0_node;
		let index = arg1_index;
		let selected_nodes = this.main.user.selected_nodes;
		
		{
			for (let i = selected_nodes.length - 1; i >= 0; i--) {
				if (
					selected_nodes[i][0].id === node.id &&
					selected_nodes[i][1] === index
				) {
					this.main.user.selected_nodes.splice(i, 1);
					ve.NodeEditorDatatype.draw();
					return;
				} else if (selected_nodes[i][0].id === node.id) {
					this.main.user.selected_nodes.splice(i, 1);
					continue;
				}
			}
			if (selected_nodes.length >= 1)
				if (selected_nodes[0][1] > 0 && index > 0) return;
		}
		
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
		ve.NodeEditorDatatype.draw();
	}
	
	clear() {
		for (let i = this.main.nodes.length - 1; i >= 0; i--)
			this.main.nodes[i].remove();
		this.main.nodes = [];
		this.main.user.selected_nodes = [];
		this.main.variables = {};
		if (this.node_layer) this.node_layer.clear();
	}
	
	_createCustomExecutionLogic(subgraph) {
		const parentOptions = this.options;
		return async function (...args) {
			// FIX: Ensure sub-editors are marked as headless to prevent static draw loops
			let sub_editor = new ve.NodeEditor(subgraph, {
				...parentOptions,
				headless: true,
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
	
	_openCustomNodeEditor() {
		let custom_node_window;
		let temp_editor = new ve.NodeEditor(
			{ nodes: [] },
			{
				project_folder: this.options.project_folder,
				node_types: this.options.node_types,
				category_types: this.options.category_types,
			},
		);
		
		let save_custom_node = () => {
			let graph_data = temp_editor.v;
			let nodes = graph_data.nodes;
			
			let meta_name = "New Custom Node";
			let meta_category = "Custom";
			let meta_output_type = "any";
			
			let n_name = nodes.find((n) => n.key === "ve_config_name");
			if (n_name && n_name.constant_values[0])
				meta_name = n_name.constant_values[0];
			
			let n_cat = nodes.find((n) => n.key === "ve_config_category");
			if (n_cat && n_cat.constant_values[0])
				meta_category = n_cat.constant_values[0];
			
			let n_out_type = nodes.find((n) => n.key === "ve_config_output_type");
			if (n_out_type && n_out_type.constant_values[0])
				meta_output_type = n_out_type.constant_values[0];
			
			let active_input_nodes = temp_editor.main.nodes.filter(
				(n) => n.value.key === "ve_input",
			);
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
			
			let output_node = nodes.find((n) => n.key === "ve_output");
			if (!output_node) {
				veToast("Custom Node must have an 'Output' node.");
				return;
			}
			
			let node_key = `custom_${Class.generateRandomID(ve.NodeEditor)}`;
			
			let custom_definition = {
				name: meta_name,
				category: meta_category,
				input_parameters: inputs,
				output_type: meta_output_type,
				options: {
					id: Class.generateRandomID(ve.NodeEditorDatatype),
					alluvial_scaling: 1,
					show_alluvial: false,
				},
				subgraph: graph_data,
				special_function: this._createCustomExecutionLogic(graph_data),
			};
			
			this.main.custom_node_types[node_key] = custom_definition;
			this.options.node_types[node_key] = custom_definition;
			
			this.drawToolbox();
			custom_node_window.close();
			veToast(`Custom Node '${meta_name}' Created.`);
		};
		
		let window_contents = new ve.RawInterface(
			{
				editor_panel: new ve.RawInterface(
					{
						editor: temp_editor,
					},
					{
						style: { width: "100%", height: "calc(100% - 3rem)" },
					},
				),
				controls: new ve.RawInterface(
					{
						save_btn: new ve.Button(save_custom_node, {
							name: "Save Custom Node",
							style: { width: "100%", height: "100%" },
						}),
					},
					{ style: { height: "3rem", padding: "0.5rem" } },
				),
			},
			{ style: { display: "flex", flexDirection: "column", height: "100%" } },
		);
		
		custom_node_window = new ve.Window(window_contents, {
			name: "Create Custom Node",
			width: "80vw",
			height: "80vh",
			can_rename: false,
			onload: () => {
				setTimeout(() => {
					temp_editor.main.nodes.push(
						new ve.NodeEditorDatatype(
							{
								coords: { x: -400, y: -200 },
								key: "ve_config_name",
								...temp_editor.options.node_types["ve_config_name"],
							},
							{
								node_editor: temp_editor,
								...temp_editor.options.node_types["ve_config_name"].options,
							},
						),
					);
					
					temp_editor.main.nodes.push(
						new ve.NodeEditorDatatype(
							{
								coords: { x: -400, y: 0 },
								key: "ve_config_category",
								...temp_editor.options.node_types["ve_config_category"],
							},
							{
								node_editor: temp_editor,
								...temp_editor.options.node_types["ve_config_category"].options,
							},
						),
					);
					
					temp_editor.main.nodes.push(
						new ve.NodeEditorDatatype(
							{
								coords: { x: -400, y: 200 },
								key: "ve_config_output_type",
								...temp_editor.options.node_types["ve_config_output_type"],
							},
							{
								node_editor: temp_editor,
								...temp_editor.options.node_types["ve_config_output_type"]
									.options,
							},
						),
					);
					
					temp_editor.main.nodes.push(
						new ve.NodeEditorDatatype(
							{
								coords: { x: 400, y: 0 },
								key: "ve_output",
								...temp_editor.options.node_types["ve_output"],
							},
							{
								node_editor: temp_editor,
								...temp_editor.options.node_types["ve_output"].options,
							},
						),
					);
					
					ve.NodeEditorDatatype.draw();
				}, 100);
			},
		});
	}
	
	drawToolbox() {
		let page_menu_obj = {};
		let unique_categories = [];
		
		Object.iterate(this.options.node_types, (local_key, local_value) => {
			if (typeof local_value !== "object" || !local_value) return;
			let category = local_value.category || "Uncategorised";
			if (!unique_categories.includes(category))
				unique_categories.push(category);
		});
		if (unique_categories.length === 0)
			unique_categories = ["Expressions", "Filters", "I/O", "Custom"];
		if (!this.options.exclude_all) unique_categories.unshift("All");
		
		for (let i = 0; i < unique_categories.length; i++) {
			let filter_names_obj = {};
			let local_search_select_obj = {};
			let category_key = unique_categories[i];
			
			for (let x = 0; x < unique_categories.length; x++)
				filter_names_obj[
					`data-${unique_categories[x]
					.toLowerCase()
					.replace(/[^a-z0-9]/g, "_")}`
					] = unique_categories[x];
			
			Object.iterate(this.options.node_types, (local_key, local_value) => {
				if (typeof local_value !== "object" || !local_value) return;
				let local_category = local_value.category || "Uncategorised";
				
				let local_category_options =
					this.options.category_types[local_category] || {};
				let local_category_colour = Colour.convertRGBAToHex(
					local_category_options.colour || [255, 255, 255],
				);
				let local_category_text_colour = Colour.convertRGBAToHex(
					local_category_options.text_colour || [0, 0, 0],
				);
				
				if (local_category === category_key || category_key === "All")
					local_search_select_obj[local_key] = new ve.Button(() => {
						if (local_key === "ve_comment") {
							let comment_window_components = {
								text_input: new ve.Text("", { placeholder: "Enter comment..." }),
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
									
									if (comment_window_components.confirm.owner) {
										comment_window_components.confirm.owner.close();
									} else if (this.current_comment_window) {
										this.current_comment_window.close();
									}
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
					}, {
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
					});
			});
			
			if (category_key === "Custom" || category_key === "All") {
				local_search_select_obj["create_custom"] = new ve.Button(
					() => {
						this._openCustomNodeEditor();
					},
					{
						name: "<icon>add_circle</icon> Create Custom Node",
						style: { button: { border: "1px dashed white" } },
					},
				);
			}
			
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
						next_queue.push(ve.NodeEditorDatatype.getNode(to_id));
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
		// FIX: Guard against re-entry during async execution
		if (this._is_running) return this.main.variables;
		this._is_running = true;
		
		try {
			let preview_mode = arg0_preview_mode;
			let dag_sequence = this.getDAGSequence();
			let resolve_arguments = (arg0_node) => {
				let node = arg0_node;
				let args = [];
				for (let i = 0; i < node.value.input_parameters.length; i++) {
					let local_parameter = node.value.input_parameters[i];
					if (node.dynamic_values[i]) {
						let resolved;
						for (let x = 0; x < ve.NodeEditorDatatype.instances.length; x++) {
							let source = ve.NodeEditorDatatype.instances[x];
							for (let y = 0; y < source.connections.length; y++) {
								let target_data = source.connections[y];
								let target_node = target_data[0];
								let target_index = target_data[1];
								if (target_node.id === node.id && target_index === i + 1) {
									resolved = this.main.variables[source.id];
									break;
								}
							}
							if (resolved !== undefined) break;
						}
						args.push(resolved);
					} else if (node.constant_values[i] !== undefined) {
						args.push(node.constant_values[i]);
					} else {
						let local_parameter_type = JSON.parse(
							JSON.stringify(local_parameter.type),
						);
						if (ve.NodeEditorDatatype.types[local_parameter_type] === undefined)
							local_parameter_type = "any";
						args.push(ve.NodeEditorDatatype.types[local_parameter_type]);
					}
				}
				return args;
			};
			
			this.main.variables = {};
			this.main.skipped_nodes = new Set();
			
			for (let i = 0; i < dag_sequence.length; i++) {
				let layer = dag_sequence[i];
				
				if (!preview_mode)
					for (let x = 0; x < dag_sequence[i].length; x++) {
						delete dag_sequence[i][x].ui.information.status;
						dag_sequence[i][x].draw();
					}
				
				await Promise.all(
					layer.map(async (local_node) => {
						let is_aborted_upstream = false;
						if (local_node.dynamic_values) {
							for (let x = 0; x < local_node.dynamic_values.length; x++) {
								if (local_node.dynamic_values[x]) {
									for (
										let j = 0;
										j < ve.NodeEditorDatatype.instances.length;
										j++
									) {
										let source = ve.NodeEditorDatatype.instances[j];
										for (let k = 0; k < source.connections.length; k++) {
											let target_data = source.connections[k];
											if (
												target_data[0].id === local_node.id &&
												target_data[1] === x + 1
											) {
												if (this.main.skipped_nodes.has(source.id))
													is_aborted_upstream = true;
												break;
											}
										}
										if (is_aborted_upstream) break;
									}
								}
								if (is_aborted_upstream) break;
							}
						}
						
						if (is_aborted_upstream) {
							this.main.skipped_nodes.add(local_node.id);
							local_node.ui.information.status = "aborted";
							if (!preview_mode) local_node.draw();
							return;
						}
						
						let args = resolve_arguments(local_node);
						let sf = local_node.value.special_function;
						let descriptor;
						let value;
						
						try {
							if (typeof sf === "function") {
								descriptor = await sf.call(this, ...args, local_node);
							} else {
								descriptor = sf;
							}
							
							if (descriptor && descriptor.abort === true) {
								this.main.skipped_nodes.add(local_node.id);
								local_node.ui.information.status = "aborted";
								if (!preview_mode) local_node.draw();
								return;
							}
							
							if (descriptor && typeof descriptor === "object")
								value = descriptor.value;
							
							if (
								!preview_mode &&
								descriptor &&
								typeof descriptor.run === "function"
							) {
								local_node.ui.information.status = "is_running";
								local_node.draw();
								await descriptor.run();
								local_node.ui.information.status = "finished";
								local_node.draw();
							} else if (!preview_mode) {
								local_node.ui.information.status = "finished";
								local_node.draw();
							}
						} catch (e) {
							console.error(`Node execution failed (${local_node.id})`, e);
							this.main.skipped_nodes.add(local_node.id);
							value = undefined;
							local_node.ui.information.status = "error";
							if (!preview_mode) local_node.draw();
						}
						
						this.main.variables[local_node.id] = value;
						local_node.ui.information.alluvial_width = Math.returnSafeNumber(
							descriptor?.alluvial_width,
							1,
						);
						local_node.ui.information.value =
							descriptor?.display_value !== undefined
								? descriptor.display_value
								: value;
						
						return value;
					}),
				);
			}
		} finally {
			this._is_running = false;
		}
		
		console.trace(`Run finished.`);
		return this.main.variables;
	}
};

veNodeEditor = function () {
	return new ve.NodeEditor(...arguments);
};