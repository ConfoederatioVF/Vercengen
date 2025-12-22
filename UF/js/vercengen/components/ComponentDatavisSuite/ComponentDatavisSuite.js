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
ve.DatavisSuite = class extends ve.Component {
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Declare local instance variables
		
	}
};