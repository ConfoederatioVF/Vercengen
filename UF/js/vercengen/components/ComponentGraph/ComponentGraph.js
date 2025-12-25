/**
 * Refer to <span color = "yellow">{@link ve.Component}</span> for methods or fields inherited from this Component's parent such as `.options.attributes` or `.element`.
 * 
 * ##### Constructor:
 * - `arg0_value`: {@link Object}
 *   - `.series`: {@link Object}
 *     - `.origin`: {@link Array}<{@link number}, {@link number}> - The X, Y origin of the top-left corner of `.value`, the first top-left populated cell.
 *     - `.pivot="column"`: {@link string} - Either 'column'/'row'.
 *     - `.symbol`: {@link Object} - The symbol the data line takes on.
 *     - `.value`: {@link Array}<{@link Array}<{@link number}>> - 2D dataframe storing values within this series. 
 *   - `.type="line_chart"`: {@link string} - The type of chart to show in the graph.
 * - `arg1_options`: {@link Object}
 *   - `.height`: {@link number}
 *   - `.width`: {@link number}
 *   - `.x`: {@link number}
 *   - `.y`: {@link number}
 * 
 * @type {ve.Graph}
 */
ve.Graph = class extends ve.Component {
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		let options = (arg1_options) ? arg1_options : {};
			super(options);
		
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
			
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-graph");
			this.element.instance = this;
			HTML.setAttributesObject(this.element, options.attributes);
		this.options = options;
		this.overlays = [];
		
		this.from_binding_fire_silently = true;
		this.v = value;
		delete this.from_binding_fire_silently;
	}
	
	draw () {
		//Declare local instance variables
		let has_coords = (this.x !== undefined || this.y !== undefined);
		
		this.element.innerHTML = "";
		if (has_coords) {
			this.element.style.position = "absolute";
			this.element.style.height = (typeof this.height === "number") ? `${this.height}px` : this.height;
			this.element.style.width = (typeof this.width === "number") ? `${this.width}px` : this.width;
			
			this.element.style.left = (typeof this.x === "number") ? `${this.x}px` : this.x;
			this.element.style.top = (typeof this.y === "number") ? `${this.y}px` : this.y;
		}
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		
		//Initialise value
		if (!value.series) value.series = {};
		if (!value.type) value.type = "line_chart";
		this.draw();
	}
};