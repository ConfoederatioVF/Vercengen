/**
 * Refer to ve.Component for methods or fields inherited from this Component's
 * parent such as `.options.attributes` or `.element`.
 *
 * Creates a drag-and-drop Node Editor using Maptalks as a backend.
 */
ve.NodeEditor = class extends ve.Component {
	/**
	 * @type {ve.NodeEditor[]}
	 */
	static instances = [];
	
	constructor(arg0_value, arg1_options) {
		let options = arg1_options ? arg1_options : {};
		let value = arg0_value;
		super(options);
		
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
			typeof ve.NodeEditor.Forse.getForseObject === "function"
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
	
	get v() {
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
	
	set v(arg0_value) {
		let data =
			typeof arg0_value === "string" ? JSON.parse(arg0_value) : arg0_value;
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
		
		ve.NodeEditorDatatype.draw();
	}
	
	_connect(arg0_node, arg1_node, arg2_index, arg3_options) {
		let index = arg2_index;
		let node = arg0_node;
		let options = arg3_options ? arg3_options : {};
		let ot_node = arg1_node;
		
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
		ve.NodeEditorDatatype.draw();
	}
	
	_createCustomExecutionLogic(subgraph) {
		let parent_options = this.options;
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
	
	_disconnect(arg0_node, arg1_node, arg2_index) {
		let index = arg2_index;
		let node = arg0_node;
		let ot_node = arg1_node;
		let node_connection_index = node.getConnection(ot_node, index);
		
		if (node_connection_index !== -1) {
			node.connections.splice(node_connection_index, 1);
			if (index > 0) ot_node.dynamic_values[index - 1] = undefined;
			ve.NodeEditorDatatype.draw();
		}
	}
	
	_openCustomNodeEditor() {
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
			let meta_name = "New Custom Node";
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
					{ editor: temp_editor },
					{ style: { width: "100%", height: "calc(100% - 3rem)" } },
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
					temp_editor.v = {
						nodes: [
							{
								coords: { x: -400, y: -200 },
								key: "ve_config_name",
							},
							{
								coords: { x: -400, y: 0 },
								key: "ve_config_category",
							},
							{
								coords: { x: -400, y: 200 },
								key: "ve_config_output_type",
							},
							{
								coords: { x: 400, y: 0 },
								key: "ve_output",
							},
						],
					};
				}, 100);
			},
		});
	}
	
	_select(arg0_node, arg1_index) {
		let index = arg1_index;
		let node = arg0_node;
		let selected_nodes = this.main.user.selected_nodes;
		
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
				
				if (local_category === category_key || category_key === "All")
					local_search_select_obj[local_key] = new ve.Button(
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
									{ coords: this._mouse_coords, key: local_key, ...local_value },
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
	
	async run(arg0_preview_mode) {
		if (this._is_running) return this.main.variables;
		this._is_running = true;
		
		try {
			let dag_sequence = this.getDAGSequence();
			let preview_mode = arg0_preview_mode;
			let resolve_arguments = (arg0_node) => {
				let args = [];
				let node = arg0_node;
				
				for (let i = 0; i < node.value.input_parameters.length; i++) {
					let local_parameter = node.value.input_parameters[i];
					
					if (node.dynamic_values[i]) {
						let resolved;
						for (let x = 0; x < ve.NodeEditorDatatype.instances.length; x++) {
							let source = ve.NodeEditorDatatype.instances[x];
							if (source.options.node_editor !== this) continue;
							for (let y = 0; y < source.connections.length; y++) {
								let target_data = source.connections[y];
								if (
									target_data[0].id === node.id &&
									target_data[1] === i + 1
								) {
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
					for (let x = 0; x < layer.length; x++) {
						delete layer[x].ui.information.status;
						layer[x].draw();
					}
				
				await Promise.all(
					layer.map(async (local_node) => {
						let is_aborted_upstream = false;
						if (local_node.dynamic_values)
							for (let x = 0; x < local_node.dynamic_values.length; x++) {
								if (local_node.dynamic_values[x])
									for (
										let j = 0;
										j < ve.NodeEditorDatatype.instances.length;
										j++
									) {
										let source = ve.NodeEditorDatatype.instances[j];
										if (source.options.node_editor !== this) continue;
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
								if (is_aborted_upstream) break;
							}
						
						if (is_aborted_upstream) {
							this.main.skipped_nodes.add(local_node.id);
							local_node.ui.information.status = "aborted";
							if (!preview_mode) local_node.draw();
							return;
						}
						
						let args = resolve_arguments(local_node);
						let descriptor;
						let sf = local_node.value.special_function;
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
							} else if (!preview_mode) {
								local_node.ui.information.status = "finished";
							}
							if (!preview_mode) local_node.draw();
						} catch (e) {
							console.error(`Node execution failed (${local_node.id})`, e);
							this.main.skipped_nodes.add(local_node.id);
							local_node.ui.information.status = "error";
							if (!preview_mode) local_node.draw();
							value = undefined;
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
		
		return this.main.variables;
	}
};

/**
 * Functional binding for ve.NodeEditor.
 */
veNodeEditor = function () {
	return new ve.NodeEditor(...arguments);
};

/**
 * Represents a single node instance within a ve.NodeEditor.
 */
ve.NodeEditorDatatype = class extends ve.Component {
	static instances = [];
	static types = {
		"number[]": [],
		"string[]": [],
		any: "",
		boolean: false,
		number: 0,
		script: "",
		string: "",
	};
	
	constructor(arg0_value, arg1_options) {
		let options = arg1_options ? arg1_options : {};
		let value = arg0_value;
		super(options);
		
		this.connections = [];
		this.constant_values = [];
		this.dynamic_values = [];
		this.geometries = [];
		this.id = Class.generateRandomID(ve.NodeEditorDatatype);
		this.options = options;
		this.ui = { information: {} };
		this.value = value ? value : {};
		
		if (!this.value.name) this.value.name = this.value.key;
		
		this.draw();
		ve.NodeEditorDatatype.instances.push(this);
		ve.NodeEditorDatatype.draw();
	}
	
	get v() {
		let current_coords = this.value.coords;
		if (this.geometries[0]) {
			let geo_coords = this.geometries[0].getFirstCoordinate();
			current_coords = { x: geo_coords.x, y: geo_coords.y };
		}
		
		return {
			connections: this.connections.map((conn) => [conn[0].id, conn[1]]),
			constant_values: JSON.parse(JSON.stringify(this.constant_values)),
			coords: current_coords,
			id: this.id,
			key: this.value.key,
			name: this.value.name,
			ui: {
				information: {
					alluvial_width: this.ui.information.alluvial_width,
					dag_layer: this.ui.information.dag_layer,
					value: this.ui.information.value,
				},
			},
		};
	}
	
	set v(arg0_value) {
		let json =
			typeof arg0_value === "string" ? JSON.parse(arg0_value) : arg0_value;
		if (!json) return;
		
		this.id = json.id || this.id;
		this.constant_values = Array.isArray(json.constant_values)
			? json.constant_values
			: [];
		this._serialised_connections = json.connections || [];
		this.value.coords = json.coords || this.value.coords;
		this.value.name = json.name || this.value.name;
		
		if (json.ui && json.ui.information)
			this.ui.information = { ...this.ui.information, ...json.ui.information };
		
		this.draw();
	}
	
	toJSON() {
		return this.v;
	}
	
	_render() {
		let layer = this.options.node_editor.node_layer;
		for (let i = 0; i < this.geometries.length; i++) {
			try {
				this.geometries[i].addTo(layer);
			} catch (e) {
				console.warn(e);
			}
		}
	}
	
	draw() {
		let category_options = this.options.category_options || {};
		let coords = this.value.coords;
		let is_comment = this.options.is_comment === true;
		
		let fill_colour = category_options.colour || [255, 255, 255, 1];
		fill_colour = Colour.convertRGBAToHex(fill_colour);
		if (is_comment) fill_colour = "#fff9c4";
		
		let marker_symbol = {
			textFill: "white",
			textHaloFill: "black",
			textHaloRadius: 1,
			textName: "•",
			textSize: {
				stops: [
					[12, 2],
					[14, 36],
				],
			},
		};
		
		let polygon_symbol = {
			polygonFill: fill_colour,
			textFaceName: "Karla",
			textFill: is_comment ? "black" : "white",
			textHaloFill: is_comment ? "none" : "black",
			textHaloRadius: is_comment ? 0 : 2,
			textSize: {
				stops: [
					[12, 2],
					[14, 14],
				],
			},
		};
		
		for (let i = 0; i < this.geometries.length; i++) this.geometries[i].remove();
		this.geometries = [];
		
		{
			let extra_geometries = [];
			let height = is_comment ? 1200 : 400;
			let width = 2000;
			
			let primary_geometry = new maptalks.Rectangle(coords, width, height, {
				properties: { id: this.id },
				symbol: {
					...polygon_symbol,
					lineColor: this.isSelected(0) ? "yellow" : "black",
					polygonOpacity: 0.8,
					textName: is_comment
						? this.value.name
						: `${this.value.name} | ${
							this.value.output_type ? this.value.output_type : "any"
						}`,
					textWrapWidth: is_comment ? 1800 : undefined,
				},
			});
			
			if (!is_comment) {
				extra_geometries.push(
					new maptalks.Marker(
						Geospatiale.translatePoint(coords, 0, -400 * 0.5),
						{
							symbol: marker_symbol,
						},
					),
				);
				extra_geometries.push(
					new maptalks.Marker(
						Geospatiale.translatePoint(coords, 2000, -400 * 0.5),
						{ symbol: marker_symbol },
					),
				);
			}
			
			if (!is_comment && this.ui.information.dag_layer !== undefined) {
				let sequence_status_colour =
					{
						aborted: "rgb(150, 50, 50)",
						error: "rgb(255, 0, 0)",
						finished: "rgb(44,108,53)",
						is_running: "rgb(240, 240, 140)",
						other: "rgb(25, 25, 25)",
					}[this.ui.information.status || "other"] || "rgb(25, 25, 25)";
				
				extra_geometries.push(
					new maptalks.Marker(Geospatiale.translatePoint(coords, 2000, 0), {
						symbol: {
							...marker_symbol,
							textFill: sequence_status_colour,
							textSize: {
								stops: [
									[12, 4],
									[14, 96],
								],
							},
						},
					}),
				);
				extra_geometries.push(
					new maptalks.Marker(Geospatiale.translatePoint(coords, 2000, 7), {
						symbol: {
							...marker_symbol,
							textFaceName: "Karla",
							textName: `${this.ui.information.dag_layer}`,
							textSize: {
								stops: [
									[12, 2],
									[14, 14],
								],
							},
						},
					}),
				);
			}
			
			let primary_geometry_collection = new maptalks.GeometryCollection(
				[primary_geometry, ...extra_geometries],
				{ draggable: true },
			);
			primary_geometry_collection.addEventListener("click", (e) => {
				this.options.node_editor._select(this, 0);
			});
			primary_geometry_collection.addEventListener("contextmenu", (e) => {
				this.openContextMenu();
			});
			
			this.geometries.push(primary_geometry_collection);
		}
		
		if (!is_comment) {
			for (let i = 0; i < this.value.input_parameters.length; i++) {
				let local_parameter = this.value.input_parameters[i];
				let local_value_name = this.constant_values[i]
					? ` | ${this.constant_values[i]}`
					: "";
				if (this.dynamic_values[i]) local_value_name = "";
				
				let local_rect = new maptalks.Rectangle(
					Geospatiale.translatePoint(coords, 0, -400 * (i + 1)),
					2000,
					400,
					{
						symbol: {
							...polygon_symbol,
							lineColor: this.isSelected(i + 1) ? "yellow" : "black",
							polygonOpacity: 0.5,
							textName: `${local_parameter.name} (${local_parameter.type})${local_value_name}`,
						},
					},
				);
				let local_left_marker = new maptalks.Marker(
					Geospatiale.translatePoint(coords, 0, -400 * (i + 1) - 400 * 0.5),
					{
						symbol: {
							...marker_symbol,
							textFill: "rgba(255, 255, 255, 0.5)",
						},
					},
				);
				
				let local_geometry_collection = new maptalks.GeometryCollection([
					local_rect,
					local_left_marker,
				]);
				local_geometry_collection.addEventListener("click", (e) => {
					this.options.node_editor._select(this, i + 1);
				});
				local_geometry_collection.addEventListener("contextmenu", (e) => {
					this.openContextMenu();
				});
				
				this.geometries.push(local_geometry_collection);
			}
		}
		
		this._render();
		this.handleEvents();
	}
	
	getConnection(arg0_node, arg1_index) {
		let index = Math.returnSafeNumber(arg1_index);
		let node = arg0_node;
		
		for (let i = 0; i < this.connections.length; i++)
			if (
				this.connections[i][0].id === node.id &&
				this.connections[i][1] === index
			)
				return i;
		
		return -1;
	}
	
	handleEvents() {
		this.geometries[0].addEventListener("dragend", (e) => {
			let first_coord = this.geometries[0].getFirstCoordinate();
			this.value.coords = { x: first_coord.x, y: first_coord.y };
			ve.NodeEditorDatatype.draw();
		});
	}
	
	hasConnection(arg0_index) {
		let index = Math.returnSafeNumber(arg0_index);
		for (let i = 0; i < ve.NodeEditorDatatype.instances.length; i++) {
			let local_node = ve.NodeEditorDatatype.instances[i];
			for (let x = 0; x < local_node.connections.length; x++)
				if (
					local_node.connections[x][0].id === this.id &&
					local_node.connections[x][1] === index
				)
					return true;
		}
		return false;
	}
	
	isSelected(arg0_index) {
		let index = Math.returnSafeNumber(arg0_index);
		let selected_nodes = this.options.node_editor.main.user.selected_nodes;
		
		for (let i = 0; i < selected_nodes.length; i++)
			if (selected_nodes[i][0].id === this.id && selected_nodes[i][1] === index)
				return true;
		
		return false;
	}
	
	openContextMenu() {
		let parameter_fields = {};
		
		if (this.options.is_comment) {
			parameter_fields["text"] = new ve.Text(this.value.name, {
				name: "Comment Text",
				onuserchange: (v) => {
					this.value.name = v;
					ve.NodeEditorDatatype.draw();
				},
			});
		} else {
			for (let i = 0; i < this.value.input_parameters.length; i++) {
				let is_actually_disabled = this.dynamic_values[i] !== undefined;
				let local_parameter = this.value.input_parameters[i];
				let local_parameter_type = JSON.parse(
					JSON.stringify(local_parameter.type),
				);
				
				if (ve.NodeEditorDatatype.types[local_parameter_type] === undefined)
					local_parameter_type = "any";
				
				let local_default_value =
					this.constant_values[i] !== undefined
						? this.constant_values[i]
						: ve.NodeEditorDatatype.types[local_parameter_type];
				
				let local_parameter_options = {
					name: local_parameter.name,
					onuserchange: (v) => {
						if (!parameter_fields[`${local_parameter.name}_toggle`].v) return;
						this.constant_values[i] = v;
						ve.NodeEditorDatatype.draw();
					},
					x: 0,
					y: i,
				};
				
				if (local_parameter_type === "number[]")
					parameter_fields[local_parameter.name] = new ve.Number(
						local_default_value,
						local_parameter_options,
					);
				else if (local_parameter_type === "string[]")
					parameter_fields[local_parameter.name] = new ve.Text(
						local_default_value,
						local_parameter_options,
					);
				else if (local_parameter_type === "boolean")
					parameter_fields[local_parameter.name] = new ve.Toggle(
						local_default_value,
						local_parameter_options,
					);
				else if (local_parameter_type === "number")
					parameter_fields[local_parameter.name] = new ve.Number(
						local_default_value,
						local_parameter_options,
					);
				else
					parameter_fields[local_parameter.name] = new ve.Text(
						local_default_value,
						local_parameter_options,
					);
				
				parameter_fields[`${local_parameter.name}_toggle`] = new ve.Toggle(
					this.constant_values[i] !== undefined && !is_actually_disabled,
					{
						off_name: `<icon class = "toggle-icon off">toggle_off</icon> &nbsp; ${
							is_actually_disabled ? "Is Connected" : "Disabled"
						}`,
						on_name: `<icon class = "toggle-icon on">toggle_on</icon> &nbsp; Enabled`,
						onuserchange: (v) => {
							if (v === false) {
								this.constant_values[i] = undefined;
							} else if (v === true) {
								if (is_actually_disabled) {
									this.constant_values[i] = undefined;
									parameter_fields[`${local_parameter.name}_toggle`].v = false;
									veToast(
										`<icon>warning</icon> Constants will not apply while node is connected.`,
									);
								} else {
									this.constant_values[i] =
										parameter_fields[local_parameter.name].v;
								}
							}
							ve.NodeEditorDatatype.draw();
						},
						x: 1,
						y: i,
					},
				);
			}
		}
		
		if (this.context_menu) this.context_menu.close();
		this.context_menu = new ve.Window(
			{
				...parameter_fields,
				delete_button: new ve.Button(
					() => {
						this.remove();
					},
					{ name: `<icon>delete</icon> Delete` },
				),
			},
			{ name: this.value.name, width: "20rem", can_rename: false },
		);
	}
	
	remove() {
		let editor = this.options.node_editor;
		if (editor && editor.main.nodes.includes(this)) {
			editor.main.nodes.splice(editor.main.nodes.indexOf(this), 1);
		}
		
		for (let i = ve.NodeEditorDatatype.instances.length - 1; i >= 0; i--) {
			let local_node = ve.NodeEditorDatatype.instances[i];
			if (local_node.id === this.id) {
				ve.NodeEditorDatatype.instances.splice(i, 1);
			} else {
				for (let x = local_node.connections.length - 1; x >= 0; x--)
					if (local_node.connections[x][0].id === this.id)
						local_node.connections.splice(x, 1);
			}
		}
		
		for (let i = 0; i < this.geometries.length; i++) this.geometries[i].remove();
		this.geometries = [];
		
		if (this.context_menu) this.context_menu.close();
		ve.NodeEditorDatatype.draw();
	}
	
	static draw() {
		ve.NodeEditor.instances.forEach((ed) => {
			if (ed.options.headless || ed._is_running) return;
			let local_dag_sequence = ed.getDAGSequence();
			if (!local_dag_sequence) return;
			
			for (let x = 0; x < local_dag_sequence.length; x++)
				for (let y = 0; y < local_dag_sequence[x].length; y++)
					local_dag_sequence[x][y].ui.information.dag_layer = x;
			ed.run(true);
		});
		
		for (let i = 0; i < ve.NodeEditorDatatype.instances.length; i++)
			ve.NodeEditorDatatype.instances[i].draw();
		
		for (let i = 0; i < ve.NodeEditorDatatype.instances.length; i++) {
			let local_node = ve.NodeEditorDatatype.instances[i];
			for (let x = 0; x < local_node.connections.length; x++) {
				let arc_connector_name = local_node.ui.information.value;
				let arc_connector_text_symbol =
					arc_connector_name !== undefined
						? {
							textFaceName: "Karla",
							textFill: "white",
							textHaloFill: "black",
							textHaloRadius: 2,
							textName: arc_connector_name.toString(),
							textPlacement: "line",
							textSize: {
								stops: [
									[12, 2],
									[14, 14],
								],
							},
						}
						: undefined;
				
				let local_ot_node = ve.NodeEditorDatatype.getNode(
					local_node.connections[x][0],
				);
				let arc_connector_line = new maptalks.ArcConnectorLine(
					local_node.geometries[0].getGeometries()[2],
					local_ot_node.geometries[
						local_node.connections[x][1]
						].getGeometries()[1],
					{
						arcDegree: 90,
						arrowPlacement: "vertex-last",
						arrowStyle: "classic",
						properties: {
							from_geometry_id: local_node.id,
							to_geometry_id: local_ot_node.id,
						},
						showOn: "always",
						symbol: {
							lineColor: "white",
							lineWidth: Math.returnSafeNumber(
								local_node?.ui?.information?.alluvial_width,
								1,
							),
							...arc_connector_text_symbol,
						},
					},
				);
				
				arc_connector_line.addTo(local_node.options.node_editor.node_layer);
				arc_connector_line._showConnect();
				local_node.geometries.push(arc_connector_line);
			}
		}
	}
	
	static getNode(arg0_node_id) {
		let node_id = arg0_node_id;
		if (node_id instanceof ve.NodeEditorDatatype) return node_id;
		
		for (let i = 0; i < ve.NodeEditorDatatype.instances.length; i++)
			if (ve.NodeEditorDatatype.instances[i].id === node_id)
				return ve.NodeEditorDatatype.instances[i];
	}
};

/**
 * Functional binding for ve.NodeEditorDatatype.
 */
veNodeEditorDatatype = function () {
	return new ve.NodeEditorDatatype(...arguments);
} 