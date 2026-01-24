

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
		this.constant_values = value.constant_values
			? JSON.parse(JSON.stringify(value.constant_values))
			: [];
		this.dynamic_values = [];
		this.geometries = [];
		
		// FIX: Scope ID to definition or generation properly
		this.id = value.id
			? value.id
			: Class.generateRandomID(ve.NodeEditorDatatype);
		
		this._serialised_connections = value.connections || [];
		this.options = options;
		this.ui = { information: {} };
		
		if (value.ui && value.ui.information) {
			this.ui.information = { ...value.ui.information };
		}
		
		this.value = value ? value : {};
		
		if (!this.value.name) this.value.name = this.value.key;
		
		ve.NodeEditorDatatype.instances.push(this);
		this.draw();
		// Removed global draw call from constructor to prevent performance bottlenecks and collisions during batch loading
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
		if (!layer) return;
		
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
			if (this.value.input_parameters)
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
			ve.NodeEditorDatatype.draw(this.options.node_editor);
		});
	}
	
	hasConnection(arg0_index) {
		let index = Math.returnSafeNumber(arg0_index);
		for (let i = 0; i < ve.NodeEditorDatatype.instances.length; i++) {
			let local_node = ve.NodeEditorDatatype.instances[i];
			if (local_node.options.node_editor !== this.options.node_editor) continue;
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
					ve.NodeEditorDatatype.draw(this.options.node_editor);
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
						ve.NodeEditorDatatype.draw(this.options.node_editor);
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
							ve.NodeEditorDatatype.draw(this.options.node_editor);
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
			// FIX: Check by REFERENCE, not by ID, to avoid removing same-ID nodes in other editors
			if (local_node === this) {
				ve.NodeEditorDatatype.instances.splice(i, 1);
			} else if (local_node.options.node_editor === editor) {
				for (let x = local_node.connections.length - 1; x >= 0; x--)
					if (local_node.connections[x][0].id === this.id)
						local_node.connections.splice(x, 1);
			}
		}
		
		for (let i = 0; i < this.geometries.length; i++)
			this.geometries[i].remove();
		this.geometries = [];
		
		if (this.context_menu) this.context_menu.close();
		ve.NodeEditorDatatype.draw(editor);
	}
	
	static draw(arg0_editor) {
		// FIX: static draw must be scoped to the specific editor instance passed to it
		let ed = arg0_editor;
		if (!ed) return;
		
		if (ed.options.headless || ed._is_running) return;
		let local_dag_sequence = ed.getDAGSequence();
		if (!local_dag_sequence) return;
		
		for (let x = 0; x < local_dag_sequence.length; x++)
			for (let y = 0; y < local_dag_sequence[x].length; y++)
				local_dag_sequence[x][y].ui.information.dag_layer = x;
		
		// Perform background dag run
		ed.run(true);
		
		for (let i = 0; i < ve.NodeEditorDatatype.instances.length; i++) {
			let node = ve.NodeEditorDatatype.instances[i];
			if (node.options.node_editor === ed) node.draw();
		}
		
		for (let i = 0; i < ve.NodeEditorDatatype.instances.length; i++) {
			let local_node = ve.NodeEditorDatatype.instances[i];
			if (local_node.options.node_editor !== ed) continue;
			
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
				
				// FIX: Pass ed to getNode to ensure we link to nodes within the SAME editor
				let local_ot_node = ve.NodeEditorDatatype.getNode(
					local_node.connections[x][0],
					ed,
				);
				if (!local_ot_node) continue;
				
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
				
				arc_connector_line.addTo(ed.node_layer);
				arc_connector_line._showConnect();
				local_node.geometries.push(arc_connector_line);
			}
		}
	}
	
	static getNode(arg0_node_id, arg1_editor) {
		let node_id = arg0_node_id;
		let ed = arg1_editor;
		if (node_id instanceof ve.NodeEditorDatatype) return node_id;
		
		for (let i = 0; i < ve.NodeEditorDatatype.instances.length; i++) {
			let node = ve.NodeEditorDatatype.instances[i];
			if (node.id === node_id) {
				// FIX: If editor is provided, ensure the node belongs to that specific editor
				if (ed && node.options.node_editor !== ed) continue;
				return node;
			}
		}
	}
};

/**
 * Functional binding for ve.NodeEditorDatatype.
 */
veNodeEditorDatatype = function () {
	return new ve.NodeEditorDatatype(...arguments);
};