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
			
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-datavis-suite");
			this.element.instance = this;
			HTML.setAttributesObject(this.element, options.attributes);
		
		this.data_scripts = (value.data_scripts) ? value.data_scripts : {};
		this.graphs = (value.graphs) ? value.graphs : {};
		this.series = (value.series) ? value.series : {};
		this.table_value = (value.table_value) ? value.table_value : {};
		
		//Populate this.components_obj here so that it can be changed piecemeal by set v()
		this.components_obj = {
			table: new ve.Table(this.table_value)
		};
		this.draw();
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
	
	draw () {
		//Reset HTML, then rebind all this.components_obj
		this.element.innerHTML = "";
		Object.iterate(this.components_obj, (local_key, local_value) => local_value.bind(this.element));
	}
};