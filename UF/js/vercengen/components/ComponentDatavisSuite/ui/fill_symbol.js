/**
 * ##### Constructor:
 * - `arg0_datavis_suite`: {@link ve.DatavisSuite}
 * - `arg1_options`: {@link Object}
 *   - `.series_key`: {@link string} - The series key being edited, if valid.
 *
 * @augments ve.Component
 * @memberof ve.DatavisSuite
 * @type {ve.DatavisSuite.FillSymbol}
 */
ve.DatavisSuite.FillSymbol = class extends ve.Component { //[WIP] - Finish function body
	constructor (arg0_datavis_suite, arg1_options) {
		//Convert from parameters
		let datavis_suite = arg0_datavis_suite;
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
			
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-datavis-suite-fill-symbol");
			this.element.instance = this;
			HTML.setAttributesObject(this.element, options.attributes);
	}
};