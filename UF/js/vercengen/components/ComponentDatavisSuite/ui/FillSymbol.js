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
ve.DatavisSuite.FillSymbol = class extends ve.Component { //[WIP] - Finish function body
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
			let io = { 
				onuserchange: () => this.fireToBinding()
			};
		this.interface = new ve.Interface({
			fill_colour: new ve.Colour("#000000", { name: "Fill Colour", ...io }),
			origin: new ve.Select({
				auto: {
					name: "Auto",
					selected: true
				},
				end: { name: "End" },
				start: { name: "Start" }
			}, { name: "Origin", ...io }),
			opacity: new ve.Range(0.7, { name: "Opacity", ...io }),
			shadow_enabled: new ve.Toggle(false, { name: "Shadow Enabled", ...io }),
			
			shadow_blur: new ve.Number(0, { name: "Shadow Blur", ...io }),
			shadow_offset_x: new ve.Number(0, { name: "Shadow Offset X", ...io }),
			shadow_offset_y: new ve.Number(0, { name: "Shadow Offset Y", ...io })
		}, {
			name: (options.name) ? options.name : "Fill Symbol"
		});
		this.from_binding_fire_silently = true;
		this.v = value;
		delete this.from_binding_fire_silently;
	}
	
	get v () {
		//Declare local instance variables
		let ui_obj = this.interface;
		let shadow_obj = (ui_obj.shadow_enabled.v) ? {
			shadow_enabled: ui_obj.shadow_enabled.v,
			
			shadowBlur: ui_obj.shadow_blur.v,
			shadowOffsetX: ui_obj.shadow_offset_x.v,
			shadowOffsetY: ui_obj.shadow_offset_y.v
		} : {};
		
		//Return statement
		return {
			color: ui_obj.fill_colour.getHex(),
			origin: ui_obj.origin.v,
			opacity: ui_obj.opacity.v,
			
			...shadow_obj
		};
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		
		//Parse value
		if (value.color) this.interface.fill_colour.v = value.color;
		if (value.origin) this.interface.origin.v = value.origin;
		if (value.opacity) this.interface.opacity.v = value.opacity;
		
		if (value.shadow_enabled) {
			if (value.shadowBlur) this.interface.shadow_blur.v = value.shadowBlur;
			if (value.shadowOffsetX) this.interface.shadow_offset_x.v = value.shadowOffsetX;
			if (value.shadowOffsetY) this.interface.shadow_offset_y.v = value.shadowOffsetY;
		}
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
