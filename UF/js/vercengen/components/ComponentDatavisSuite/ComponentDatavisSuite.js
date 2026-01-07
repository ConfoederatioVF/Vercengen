/**
 * Refer to <span color = "yellow">{@link ve.Component}</span> for methods or fields inherited from this Component's parent such as `.options.attributes` or `.element`.
 * 
 * ##### Constructor:
 * - `arg0_value`: {@link Object}
 *   - `.data_scripts`: {@link Object}
 *     - `<script_key>`: {@link string}
 *       - `.name`: {@link string}
 *       - 
 *       - `.description`: {@link string}
 *       - `.tags`: {@link Array}<{@link string}>
 *       - `.value`; {@link Object} - The JSON object that stores the current script from which to serialise/deserialise.
 *   - `.graphs`: {@link Object}
 *     - `<graph_key>`: {@link ve.Graph}
 *   - `.series`: {@link Object}
 *     - `<series_key>`: {@link Object}
 *       - `.coords`: {@link Array}<{@link Array}<{@link string}, {@link number}, {@link number}>, {@link Array}<{@link string}, {@link number}, {@link number}>> - The coords/range of the series using the Spreadsheet Name for the [0] element.
 *       - `.name`: {@link string} - The name of the series, data column header value by default.
 *       - `.pivot="column"`: {@link string} - Either 'column'/'row'.
 *       - `.symbol`: {@link Object} - Echarts bindings per series.
 *   - `.table_value`: {@link Object} - The ve.Spreadsheet value that can be used to restore both formulas and values.
 * - `arg1_options`: {@link Object}
 *   - `.dark_mode=true`: {@link boolean}
 *
 * @augments ve.Component
 * @memberof ve.Component
 * @type {ve.DatavisSuite}
 */
ve.DatavisSuite = class extends ve.Component { //[WIP] - Finish function body
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		options.dark_mode = (options.dark_mode !== undefined) ? options.dark_mode : true;
			
		//Declare local instance variables
		let topbar_button_style = { marginLeft: "var(--cell-padding)" };
		
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-datavis-suite");
			this.element.instance = this;
			this.element.style.display = "flex";
			this.element.style.flexDirection = "column";
			this.element.style.height = "100%";
			HTML.setAttributesObject(this.element, options.attributes);
		this.options = options;
		
		this.data_scripts = (value.data_scripts) ? value.data_scripts : {};
		this.graphs = (value.graphs) ? value.graphs : {};
		this.series = (value.series) ? value.series : {};
		this.table_value = (value.table_value) ? value.table_value : {};
		
		//Populate this.components_obj here so that it can be changed piecemeal by set v()
		this.components_obj = {
			topbar_interface: new ve.RawInterface({
				edit_graph_button: new ve.Button(() => {
					this.openEditGraph();
				}, { 
					name: "Graph", style: topbar_button_style }),
				edit_series_button: new ve.Button(() => {
					this.openEditSeriesHierarchy();
				}, { name: "Series",
					style: topbar_button_style }),
				script_button: new ve.Button(() => {
					if (this.script_manager_window) this.script_manager_window.close();
					this.script_manager_window = veWindow({
						script_manager: new ve.ScriptManager()
					}, {
						name: "ScriptManager (Datavis Suite)",
						
						can_rename: false,
						width: "80dvw"
					})
				}, { name: "ScriptManager", 
					style: topbar_button_style }),
				view_button: new ve.Button(() => {}, { name: "View", 
					style: topbar_button_style })
			}),
			scene_interface: new ve.RawInterface({
				file_explorer: new ve.FileExplorer(undefined, {
					style: {
						flex: "0 0 20rem",
						maxHeight: "50rem",
						overflowY: "auto"
					},
					x: 0, y: 0
				}),
				table: new ve.Spreadsheet(this.table_value, {
					dark_mode: this.options.dark_mode,
					style: {
						height: "auto",
						flex: "1 1 auto"
					},
					x: 1, y: 0,
					
					onuserchange: (v) => {
						this.drawGraphs();
					}
				})
			}, {
				style: {
					display: "flex"
				}
			})
		};
		this.redraw();
		
		this.table_obj = this.components_obj.scene_interface.table;
	}
	
	get v () {
		//Return statement
		return {
			data_scripts: this.data_scripts,
			graphs: this.graphs,
			series: this.series,
			table_value: this.table_value
		};
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
	}
	
	drawEditGraph () {
		//Declare local instance variables
		let actions_bar = new ve.HierarchyDatatype({
			create_new_graph: new ve.Button(() => {
				let new_graph_id = Object.generateRandomID(this.graphs);
				
				this.graphs[new_graph_id] = new ve.Graph();
					this.graphs[new_graph_id].options.order = Object.keys(this.graphs).length;
				this.drawEditGraph();
				
				veToast(`Added chart to graph.`);
			}, { name: "<icon>add_chart</icon>", tooltip: "Add Graph" }),
			create_new_graphlegend: new ve.Button(() => {
				
			}, { name: "<icon>format_list_bulleted</icon>", tooltip: "Add Legend" }),
			create_new_graphtext: new ve.Button(() => {
				
			}, { name: "<icon>notes</icon>", tooltip: "Add Overlay Text" })
		}, { disabled: true });
		let hierarchy_obj = {};
		
		//Declare new_hierarchy and push it to this.graph_window.container.graph_options if possible
		if (this.graph_window) {
			let graph_options = this.graph_window.container.graph_options;
			
			Object.iterate(this.graphs, (local_key, local_value) => { //[WIP] - Finish population function
				if (local_value instanceof ve.Graph) {
					let graph_name = (local_value?.options?.symbol?.title?.text) ?
						local_value.options.symbol.title.text : "New Graph"
					
					hierarchy_obj[local_key] = new ve.HierarchyDatatype({
						icon: new ve.HTML("<icon>show_chart</icon>"),
						
						delete_button: new ve.Button(() => {}, {
							name: "<icon>delete</icon>",
							tooltip: "Delete Graph",
							style: {
								marginLeft: "auto",
								order: 100
							}
						}),
						context_menu_button: new ve.Button(() => {
							if (this.edit_graph_window) this.edit_graph_window.close();
							
							let series_names = this.getAllSeriesNames();
							let series_options = {
								onuserchange: (v) => {
									if (!this.series[v])
										veToast(`<icon>warning</icon> The data series you have selected is not valid.`);
									this.assigned_series_list.fireToBinding();
								}
							};
							let series_select = new ve.Datalist(series_names, series_options);
								series_select.placeholder = series_names;
								
							let assigned_series_values = [];
								if (local_value.value.series) {
									let series_obj = local_value.value.series;
									
									Object.iterate(series_obj, (local_series_key, local_series_obj) => {
										let local_datalist = new ve.Datalist(series_names, series_options);
											local_datalist.v = series_names[local_series_key];
										assigned_series_values.push(local_datalist);
									});
								}
							
							let assigned_series_list = new ve.List((assigned_series_values.length > 0) ? assigned_series_values : [series_select], {
								name: "Attached Series",
								onuserchange: (v) => {
									local_value.value.series = {};
									
									//Iterate over all v components
									for (let i = 0; i < v.length; i++)
										local_value.addSeries(this.series[v[i].v], {
											key: v[i].v,
											table_obj: this.table_obj
										});
								},
								options: series_options 
							});
								assigned_series_list.placeholder = series_names;
								this.assigned_series_list = assigned_series_list;
							
							this.edit_graph_window = new ve.Window({ //Add series using ve.List<ve.Datalist>
								assigned_series: assigned_series_list
							}, {
								name: `Edit ${graph_name}`,
								can_rename: false,
								width: "30rem"
							});
						}, {
							name: "<icon>more_vert</icon>",
							tooltip: "Modify Graph",
							style: {
								order: 101
							}
						})
					}, {
						key: local_key,
						name: graph_name,
						name_options: {
							onuserchange: (v) => {
								if (!local_value.options.title) local_value.options.title = {};
									local_value.options.title.text = v;
								local_value.draw();
							}
						}
					});
				}
			}, {
				sort_mode: {
					key: "order",
					type: "ascending"
				}
			});
			
			let new_hierarchy = new ve.Hierarchy({
				actions_bar: actions_bar,
				...hierarchy_obj
			}, {
				onuserchange: (v, e) => {
					//Declare local instance variables
					let hierarchy_array = e.getHierarchyArray();
					
					for (let i = 0; i < hierarchy_array.length; i++) try {
						this.series[hierarchy_array[i].instance.options.key].order = i;
					} catch (e) {}
				}
			});
			
			graph_options.element.innerHTML = "";
			graph_options.element.appendChild(new_hierarchy.element);
			this.drawGraphs();
		}
	}
	
	drawEditSeriesHierarchy () {
		let actions_bar = new ve.HierarchyDatatype({
			create_new_series: new ve.Button(() => {
				let new_series_id = Object.generateRandomID(this.series);
				
				//Create new series and redraw hierarchy
				this.series[new_series_id] = {
					coords: this.table_obj.getSelectedRange(),
					order: Object.keys(this.series).length,
					pivot: "column",
					symbol: {}
				};
				this.drawEditSeriesHierarchy();
			}, { 
				name: "<icon>add</icon> New Series", 
				tooltip: "Create New Series"
			})
		}, {
			disabled: true
		});
		let hierarchy_obj = {};
		
		//Populate hierarchy_obj based off current .series
		Object.iterate(this.series, (local_key, local_value) => {
			let series_name = this.getSeriesName(local_value);
			
			hierarchy_obj[local_key] = new ve.HierarchyDatatype({
				icon: new ve.HTML("<icon>legend_toggle</icon>"),
				
				series_range: new ve.HTML(`(${this.table_obj.getRangeName(local_value.coords)})`, {
					style: { order: 1 }
				}),
				delete_button: new ve.Button(() => {
					new ve.Confirm(`Are you sure you wish to delete ${series_name}?`, {
						special_function: () => {
							delete this.series[local_key];
							this.drawEditSeriesHierarchy();
						}
					});
				}, {
					name: "<icon>delete</icon>",
					tooltip: "Delete Series",
					style: {
						marginLeft: "auto",
						order: 100
					}
				}),
				context_menu_button: new ve.Button(() => {
					this.openEditSeries(local_value);
				}, { 
					name: "<icon>more_vert</icon>",
					tooltip: "Modify Series",
					style: {
						order: 101
					}
				})
			}, {
				key: local_key,
				name: series_name,
				name_options: {
					onuserchange: (v) => {
						local_value.name = v;
					}
				}
			});
		}, {
			sort_mode: {
				key: "order",
				type: "ascending"
			}
		});
		
		//Declare new_hierarchy and push it to this.series_window.hierarchy if possible
		let new_hierarchy = new ve.Hierarchy({
			actions_bar: actions_bar,
			...hierarchy_obj
		}, {
			onuserchange: (v, e) => {
				//Declare local instance variables
				let hierarchy_array = e.getHierarchyArray();
				
				for (let i = 0; i < hierarchy_array.length; i++) try {
					this.series[hierarchy_array[i].instance.options.key].order = i;
				} catch (e) {}
			}
		});
		
		if (this.series_window) {
			this.series_window.hierarchy.element.innerHTML = "";
			this.series_window.hierarchy.element.appendChild(new_hierarchy.element);
		}
		
		//Return statement
		return new_hierarchy;
	}
	
	drawGraphs (arg0_resize_only) {
		//Convert from parameters
		let resize_only = arg0_resize_only;
		
		//Update graph_window if possible
		if (this.graph_window)
			if (this.graph_window.container.graph) {
				let graph_el = this.graph_window.container.graph.element;
				
				graph_el.innerHTML = "";
				Object.iterate(this.graphs, (local_key, local_value) => {
					if (!resize_only && local_value.value.series) {
						let series_obj = JSON.parse(JSON.stringify(local_value.value.series));
						
						local_value.value.series = {};
						Object.iterate(series_obj, (local_series_key, local_series_obj) =>
							local_value.addSeries(this.series[local_series_key], {
								key: local_series_key,
								table_obj: this.table_obj
							}));
					}
					
					graph_el.appendChild(local_value.element);
					setTimeout(() => local_value.draw());
				});
			}
	}
	
	getAllSeriesNames () {
		//Declare local instance variables
		let return_obj = {};
		
		//Iterate over this.series and populate return_obj
		Object.iterate(this.series, (local_key, local_value) =>
			return_obj[local_key] = this.getSeriesName(local_value));
		
		//Return statement
		return return_obj;
	}
	
	getSeriesName (arg0_series_obj) {
		//Convert from parameters
		let series_obj = (arg0_series_obj) ? arg0_series_obj : {};
		
		//Declare local instance variables
		let series_name = "New Series";
			if (!series_obj.name) {
				if (series_obj.coords)
					//The series_name is located in the top left of the current range
					series_name = this.components_obj.scene_interface.table.getCellData(...series_obj.coords[0])?.v;
				if (series_name === undefined || series_name.length === 0)
					series_name = "New Series";
			} else {
				series_name = series_obj.name;
			}
			
		//Return statement
		return series_name;
	}
	
	openEditGraph () {
		//Close this.graph_window if already open
		if (this.graph_window) this.graph_window.close();
		
		//Open this.graph_window with controls on the left and visualisation on the right
		this.graph_window = new ve.Window({
			container: new ve.FlexInterface({
				graph_options: new ve.HTML("Loading ..", {
					style: {
						scrollbarWidth: "thin"
					}
				}),
				graph: new ve.RawInterface({}, {
					style: {
						height: "100%",
						width: "100%",
						
						overflow: "hidden"
					}
				})
			}, {
				onuserchange: (v, e) => {
					this.drawGraphs(true);
				},
				style: {
					padding: 0
				}
			})
		}, {
			name: "Edit Graph",
			can_rename: false,
			width: "30rem",
			
			onuserchange: (v, e) => {
				if (v.resize)
					this.drawGraphs(true);
			}
		});
		this.drawEditGraph();
	}
	
	openEditSeries (arg0_series_obj) {
		//Convert from parameters
		let series_obj = (arg0_series_obj) ? arg0_series_obj : {};
		
		//Declare local instance variables
		let series_name = this.getSeriesName(series_obj);
		
		//Refresh series window
		if (this.edit_series_window) this.edit_series_window.close();
		this.edit_series_window = new ve.Window({
			range_information: new ve.HTML(() => `Series Range: ${this.table_obj.getRangeName(series_obj.coords)}`),
			range_selection: new ve.RawInterface({
				clear_range: new ve.Button(() => {
					delete series_obj.coords;
					this.drawEditSeriesHierarchy();
					this.drawGraphs();
					
					veToast(`Cleared selected series range.`);
				}, { name: "Clear Range", limit: () => series_obj.coords }),
				select_series_range: new ve.Button(() => {
					this.table_obj.setSelectedRange(series_obj.coords[0], series_obj.coords[1]);
				}, { name: "Select Series Range", limit: () => series_obj.coords }),
				set_series_range: new ve.Button(() => {
					try {
						series_obj.coords = this.table_obj.getSelectedRange();
						this.drawEditSeriesHierarchy();
						this.drawGraphs();
						
						veToast(`New series range set.`);
					} catch (e) { console.error(e); }
				}, { name: "Set Series Range" })
			}),
			
			symbol: new ve.Interface({
				stroke_colour: new ve.Colour([255, 255, 255], {
					onuserchange: (v, e) => {
						
					}
				})
			}, {
				name: "Series Symbol"
			})
		}, {
			name: `Edit ${series_name}`,
			can_rename: false,
			width: "30rem"
		});
	}
	
	openEditSeriesHierarchy () {
		//Close this.series_window if already open
		if (this.series_window) this.series_window.close();
		
		//Open this.series_window
		this.series_window = new ve.Window({ //Use ve.Hierarchy for list creation
			hierarchy: new ve.HTML("Loading ..", { style: { padding: 0 } })
		}, { 
			name: "Data Series", 
			can_rename: false,
			width: "30rem"
		});
		this.drawEditSeriesHierarchy();
	}
	
	openScriptManager () {
		
	}
	
	redraw () {
		//Reset HTML, then rebind all this.components_obj
		//this.element.innerHTML = "";
		Object.iterate(this.components_obj, (local_key, local_value) => local_value.bind(this.element));
	}
};