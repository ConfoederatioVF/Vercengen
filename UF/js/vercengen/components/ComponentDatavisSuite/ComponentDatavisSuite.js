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
 *     - `<graph_key>`: {@link Object}
 *       - `.height`: {@link string}
 *       - `.width`: {@link string}
 *       - `.x`: {@link string}
 *       - `.y`: {@link string}
 *       - 
 *       - `.overlay_components`: {@link Array}<{@link ve.Component}>
 *       - `.symbol`: {@link Object} - Echarts bindings.
 *       - `.type`: {@link string}
 *   - `.series`: {@link Object}
 *     - `<series_key>`: {@link Object}
 *       - `.coords`: {@link Array}<{@link Array}<{@link string}, {@link number}, {@link number}>, {@link Array}<{@link string}, {@link number}, {@link number}>> - The coords/range of the series using the Spreadsheet Name for the [0] element.
 *       - `.symbol`: {@link Object} - Echarts bindings per series.
 *   - `.table_value`: {@link Object} - The ve.Table value that can be used to restore both formulas and values.
 * - `arg1_options`: {@link Object}
 *   - `.dark_mode=true`: {@link boolean}
 *
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
				edit_graph_button: new ve.Button(() => {}, { 
					name: "Graph", style: topbar_button_style }),
				edit_series_button: new ve.Button(() => {}, { name: "Series",
					style: topbar_button_style }),
				script_button: new ve.Button(() => {}, { name: "ScriptManager", 
					style: topbar_button_style })
			}),
			table: new ve.Table(this.table_value, {
				dark_mode: this.options.dark_mode,
				style: {
					flex: 1,
					height: "auto",
					padding: 0 
				}
			})
		};
		this.redraw();
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
	
	drawEditSeriesHierarchy () { //[WIP] - Finish function body
		//Declare local instance variables
		let actions_bar = new ve.HierarchyDatatype({
			create_new_series: new ve.Button(() => {
				
			}, { name: "<icon>forms_add_on</icon>", tooltip: "Create New Series" })
		});
		let hierarchy_obj = {};
		
		//Populate hierarchy_obj based off current .series
		
		//Declare new_hierarchy and push it to this.series_window.hierarchy if possible
		let new_hierarchy = new ve.Hierarchy({
			actions_bar: actions_bar,
			...hierarchy_obj
		});
		
		if (this.series_window) {
			this.series_window.hierarchy.element.innerHTML = "";
			this.series_window.hierarchy.element.appendChild(new_hierarchy);
		}
		
		//Return statement
		return new_hierarchy;
	}
	
	openEditGraph () {
		
	}
	
	openEditSeries () { //[WIP] - Finish function body
		//Close this.series_window if already open
		if (this.series_window) this.series_window.close();
		
		//Declare local instance variable
		let actions_bar = new ve.HierarchyDatatype({
			create_new_series: new ve.Button(() => {
				
			}, { name: "<icon>forms_add_on</icon>", tooltip: "Create New Series" })
		});
		let hierarchy_obj = {};
		
		//Populate hierarchy_obj based off current .series
		
		//Open this.series_window
		this.series_window = new ve.Window({ //Use ve.Hierarchy for list creation
			hierarchy: new ve.HTML("Loading ..", { style: { padding: 0 } })
		}, { 
			name: "Series", 
			can_rename: false 
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