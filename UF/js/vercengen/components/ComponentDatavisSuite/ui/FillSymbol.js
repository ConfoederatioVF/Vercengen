/**
 * Internal sub-component of <span color = "yellow">{@link ve.DatavisSuite}</span>. 
 * 
 * Please refer to <span color = "yellow">{@link ve.Component}</span> for methods or fields inherited from this Component's parent such as `.options.attributes` or `.element`.
 * 
 * ##### Constructor:
 * - `arg0_value`: {@link Object}
 *   - `.fill_colour`: {@link string}
 *   - `.origin="auto"`: {@link number}|{@link string} - Either 'auto'/'start'/'end'.
 *   - `.opacity=0.7`: {@link number} - Value from 0 to 1.
 *   - 
 *   - `.shadow_blur`: {@link number}
 *   - `.shadow_offset_x`: {@link number}
 *   - `.shadow_offset_y`: {@link number}
 * - `arg1_options`: {@link Object}
 *   - `.name`: {@link string}
 *
 * @augments ve.Component
 * @memberof ve.Component.ve.DatavisSuite
 * @type {ve.DatavisSuite.FillSymbol}
 */
ve.DatavisSuite.FillSymbol = class extends ve.Component { //[WIP] - Refactor to use .value mutation
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
			
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-datavis-suite-fill-symbol");
			this.element.instance = this;
			HTML.setAttributesObject(this.element, options.attributes);
		this.value = {};
		this.from_binding_fire_silently = true;
		this.v = value;
		delete this.from_binding_fire_silently;
	}
	
	get v () {
		//Return statement
		return this.value;
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		
		//Parse value
		this.element.innerHTML = "";
		this.interface = new ve.Interface({
			fill_colour: new ve.Colour(value.color, {
				name: "Fill Colour",
				onuserchange: (v, e) => this.value.color = e.getHex()
			}),
			origin: new ve.Select({
				auto: { name: "Auto" },
				end: { name: "End" },
				start: { name: "Start" }
			}, {
				name: "Origin",
				selected: (value.origin) ? value.origin : "auto",
				onuserchange: (v) => this.value.origin = v
			}),
			opacity: new ve.Range(Math.returnSafeNumber(value.opacity, 0.7), {
				name: "Opacity",
				onuserchange: (v) => this.value.opacity = v
			}),
			
			shadow_blur: new ve.Number(Math.returnSafeNumber(value.shadowBlur), {
				name: "Shadow Blur",
				onuserchange: (v) => this.value.shadowBlur = v
			}),
			shadow_offset_x: new ve.Number(Math.returnSafeNumber(value.shadowOffsetX), {
				name: "Shadow Offset X",
				onuserchange: (v) => this.value.shadowOffsetX = v
			}),
			shadow_offset_y: new ve.Number(Math.returnSafeNumber(value.shadowOffsetY), {
				name: "Shadow Offset Y",
				onuserchange: (v) => this.value.shadowOffsetY = v
			})
		}, {
			name: (this.options.name) ? this.options.name : "Fill Symbol"
		});
		this.interface.bind(this.element);
		this.value = value;
	}
};

//Functional binding

/**
 * @returns {ve.DatavisSuite.FillSymbol}
 */
veDatavisSuiteFillSymbol = function () {
	//Return statement
	return new ve.DatavisSuite.FillSymbol(...arguments);
};
