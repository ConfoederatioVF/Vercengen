ve.DatavisSuite.TextSymbol = class extends ve.Component {
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		let options = (arg1_options) ? arg1_options : {};
		super(options);
		
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-datavis-suite-text-symbol");
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
			colour: new ve.Colour((value.color) ? value.color : "#000000", {
				name: "Colour",
				is_rgba: true,
				onuserchange: (v, e) => this.value.color = e.getHex()
			}),
			ellipsis: new ve.Text((value.ellipsis) ? value.ellipsis : "...", {
				name: "Ellipsis",
				onuserchange: (v) => this.value.ellipsis = v
			}),
			font_family: new ve.Text((value.fontFamily) ? value.fontFamily : "sans-serif", {
				name: "Font Family",
				onuserchange: (v) => this.value.fontFamily = v
			}),
			font_size: new ve.Number(Math.returnSafeNumber(value.fontSize, 12), {
				name: "Font Size",
				onuserchange: (v) => this.value.fontSize = v
			}),
			font_style: new ve.Select({
				normal: { name: "Normal" },
				italic: { name: "Italic" },
				oblique: { name: "Oblique" }
			}, {
				name: "Font Style",
				onuserchange: (v) => this.value.fontStyle = v,
				selected: (value.fontStyle) ? value.fontStyle : "normal"
			}),
			font_weight: new ve.Select({
				bold: { name: "Bold" },
				bolder: { name: "Bolder" },
				normal: { name: "Normal" },
				lighter: { name: "Lighter" }
			}, {
				name: "Font Weight",
				onuserchange: (v) => this.value.fontWeight = v,
				selected: (value.fontWeight) ? value.fontWeight : "normal"
			}),
			height: new ve.Number(Math.returnSafeNumber(value.height, 12), {
				name: "Height",
				onuserchange: (v) => this.value.height = v
			}),
			overflow: new ve.Select({
				break: { name: "Break" },
				breakAll: { name: "Break All" },
				none: { name: "None" },
				truncate: { name: "Truncate" }
			}, {
				name: "Overflow",
				onuserchange: (v) => this.value.overflow = v,
				selected: (value.overflow) ? value.overflow : "none"
			}),
			text_border_colour: new ve.Colour((value.textBorderColor) ? value.textBorderColor : "#000000", {
				name: "Text Border Colour",
				is_rgba: true,
				onuserchange: (v, e) => this.value.textBorderColor = e.getHex()
			}),
			text_border_dash_offset: new ve.Number(Math.returnSafeNumber(value.textBorderDashOffset, 0), {
				name: "Text Border Dash Offset",
				onuserchange: (v) => this.value.textBorderDashOffset = v
			}),
			text_border_type: new ve.Select({
				solid: { name: "Solid" },
				dashed: { name: "Dashed" },
				dotted: { name: "Dotted" }
			}, {
				name: "Text Border Type",
				onuserchange: (v) => this.value.textBorderType = v,
				selected: (value.textBorderType) ? value.textBorderType : "none"
			}),
			text_border_width: new ve.Number(Math.returnSafeNumber(value.textBorderWidth, 0), {
				name: "Text Border Width",
				onuserchange: (v) => this.value.textBorderWidth
			}),
			text_shadow_blur: new ve.Number(Math.returnSafeNumber(value.textShadowBlur), {
				name: "Shadow Blur",
				onuserchange: (v) => this.value.textShadowBlur = v
			}),
			text_shadow_colour: new ve.Colour((value.textShadowColor) ? value.textShadowColor : "#000000", {
				name: "Text Shadow Colour",
				is_rgba: true,
				onuserchange: (v, e) => this.value.textShadowColor = e.getHex()
			}),
			text_shadow_offset_x: new ve.Number(Math.returnSafeNumber(value.textShadowOffsetX), {
				name: "Shadow Offset X",
				onuserchange: (v) => this.value.textShadowOffsetX = v
			}),
			text_shadow_offset_y: new ve.Number(Math.returnSafeNumber(value.textShadowOffsetY), {
				name: "Shadow Offset Y",
				onuserchange: (v) => this.value.textShadowOffsetY = v
			}),
			width: new ve.Number(Math.returnSafeNumber(value.width, 0), {
				name: "Width",
				onuserchange: (v) => this.value.width = v
			})
		}, {
			name: (this.options.name) ? this.options.name : "Text Symbol"
		});
		this.interface.bind(this.element);
		this.value = value;
	}
};

//Functional binding

/**
 * @returns {ve.DatavisSuite.StrokeSymbol}
 */
veDatavisSuiteTextSymbol = function () {
	//Return statement
	return new ve.DatavisSuite.StrokeSymbol(...arguments);
};