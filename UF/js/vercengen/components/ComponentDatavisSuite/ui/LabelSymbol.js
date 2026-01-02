/**
 * ##### Constructor;
 * - `arg0_value`: {@link Object}
 * - `arg1_options`: {@link Object}
 *   - `.name`; {@link string}
 * 
 * @augments ve.Component
 * @memberof ve.Component.ve.DatavisSuite
 * @type {ve.DatavisSuite.LabelSymbol}
 */
ve.DatavisSuite.LabelSymbol = class extends ve.Component { //[WIP] - Refactor to use .value mutation
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-datavis-suite-labels-symbol");
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
	
	set v (arg0_value) { //[WIP] - Finish function body
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		
		//Parse value
		this.element.innerHTML = "";
		this.interface = new ve.Interface({
			text_options: new ve.Interface({
				show: new ve.Toggle((value.show !== undefined) ? value.show : true, { 
					name: "Show", 
					onuserchange: (v) => this.value.show = v
				}),
				
				colour: new ve.Colour((value.color) ? value.color : "#ffffff", { 
					name: "Colour",
					onuserchange: (v) => this.value.color = v
				}),
				formatter: new ve.Text((value.formatter) ? value.formatter : "", { 
					name: "Formatter", 
					onuserchange: (v) => this.value.formatter = v
				}),
				font_family: new ve.Text((value.fontFamily) ? value.fontFamily : "sans-serif", { 
					name: "Font Family",
					onuserchange: (v) => this.value.fontFamily = v
				}),
				font_size: new ve.Number(Math.returnSafeNumber(value.fontSize, 12), { 
					min: 0, 
					name: "Font Size",
					onuserchange: (v) => this.value.fontSize = v
				}),
				font_style: new ve.Select({
					normal: { name: "Normal" },
					italic: { name: "Italic" },
					oblique: { name: "Oblique" }
				}, { 
					name: "Font Style", 
					selected: (value.fontStyle) ? value.fontStyle : "normal",
					onuserchange: (v) => this.value.fontStyle = v
				}),
				font_weight: new ve.Select({
					light: { name: "Light" },
					normal: { name: "Normal" },
					bolder: { name: "Medium" },
					bold: { name: "Bold" }
				}, { 
					name: "Font Weight",
					selected: (value.fontWeight) ? value.fontWeight : "normal",
					onuserchange: (v) => this.value.fontWeight = v
				}),
				height: new ve.Number(Math.returnSafeNumber(value.height,50), { 
					min: 0, 
					name: "Height",
					onuserchange: (v) => this.value.height = 50
				}),
				width: new ve.Number(Math.returnSafeNumber(value.width, 100), { 
					min: 0, 
					name: "Width", 
					onuserchange: (v) => this.value.width = 100
				})
			}, { name: "Text Options" }),
			text_style: new ve.Interface({
				background_colour: new ve.Colour((value.backgroundColor) ? 
					value.backgroundColor : "#000000", { 
					name: "Background Colour",
					has_opacity: true,
					onuserchange: (v, e) => this.value.backgroundColor = e.getHex()
				}),
				border_colour: new ve.Colour((value.borderColor) ? value.borderColor : "#000000", { 
					name: "Border Colour",
					onuserchange: (v, e) => this.value.borderColor = e.getHex()
				}),
				border_dash_offset: new ve.Number(Math.returnSafeNumber(value.borderDashOffset), { 
					name: "Border Dash Offset", 
					onuserchange: (v) => this.value.borderDashOffset = v
				}),
				border_radius: new ve.Number(Math.returnSafeNumber(value.borderRadius), { 
					name: "Border Radius",
					onuserchange: (v) => this.value.borderRadius = v
				}),
				border_type: new ve.Select({
					dashed: { name: "Dashed" },
					dotted: { name: "Dotted" },
					solid: { name: "Solid" },
				}, { 
					name: "Border Type",
					onuserchange: (v) => this.value.borderType = v,
					selected: (value.borderType) ? value.borderType : "solid"
				}),
				border_width: new ve.Number(Math.returnSafeNumber(value.borderWidth), { 
					name: "Border Width", 
					onuserchange: (v) => this.value.borderWidth = v
				}),
				distance: new ve.Number(Math.returnSafeNumber(value.distance, 5), { 
					name: "Distance",
					onuserchange: (v) => this.value.distance = v
				}),
				ellipsis: new ve.Text((value.ellipsis) ? value.ellipsis : "...", { 
					name: "Ellipsis", 
					onuserchange: (v) => this.value.ellipsis = v
				}),
				line_height: new ve.Number(Math.returnSafeNumber(value.lineHeight, 12), { 
					min: 0, 
					name: "Line Height",
					onuserchange: (v) => this.value.lineHeight = v
				}),
				offset_x: new ve.Number((value.offset) ? Math.returnSafeNumber(value.offset[0]) : 0, { 
					name: "Offset X", 
					onuserchange: (v) => this.value.offset = [v, this.interface.text_style.offset_y.v]
				}),
				offset_y: new ve.Number((value.offset) ? Math.returnSafeNumber(value.offset[1]) : 0, { 
					name: "Offset Y",
					onuserchange: (v) => this.value.offset = [this.interface.text_style.offset_x.v, v]
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
				min_margin: new ve.Number(Math.returnSafeNumber(value.minMargin), { 
					name: "Minimum Margin",
					onuserchange: (v) => this.value.minMargin = v
				}),
				padding: new ve.List((value.padding) ? 
					value.padding.map((v) => ve.Number(v)) : [new ve.Number(0)], { 
					min: 1, max: 4, 
					name: "Padding",
					onuserchange: (v) => this.value.padding = v.map((v) => v.v)
				}),
				position: new ve.Select({
					bottom: { name: "Bottom" },
					inside: { name: "Inside" },
					insideBottom: { name: "Inside Bottom" },
					insideBottomLeft: { name: "Inside Bottom Left" },
					insideBottomRight: { name: "Inside Bottom Right" },
					insideLeft: { name: "Inside Left" },
					insideRight: { name: "Inside Right" },
					insideTop: { name: "Inside Top" },
					insideTopLeft: { name: "Inside Top Left" },
					insideTopRight: { name: "Inside Top Right" },
					left: { name: "Left" },
					right: { name: "Right" },
					top: { name: "Top" }
				}, { 
					name: "Position",
					onuserchange: (v) => this.value.position = v,
					selected: (value.position) ? value.position : "top"
				}),
				rotate: new ve.Number(Math.returnSafeNumber(value.rotate), { 
					name: "Rotate",
					onuserchange: (v) => this.value.rotate = v
				}),
				text_align_horizontal: new ve.Select({
					left: { name: "Left" },
					center: { name: "Centre" },
					right: { name: "Right" }
				}, { 
					name: "Text Align (Horizontal)",
					onuserchange: (v) => this.value.align = v,
					selected: (value.align) ? value.align : "left"
				}),
				text_align_vertical: new ve.Select({
					top: { name: "Top" },
					middle: { name: "Middle" },
					bottom: { name: "Bottom" }
				}, { 
					name: "Text Align (Vertical)",
					onuserchange: (v) => this.value.verticalAlign = v,
					selected: (value.verticalAlign) ? value.verticalAlign : "middle"
				}),
				text_border_colour: new ve.Colour((value.textBorderColor) ? 
					value.textBorderColor : "#000000", { 
					name: "Text Border Colour",
					onuserchange: (v) => this.value.textBorderColor = v
				}),
				text_border_dash_offset: new ve.Number(Math.returnSafeNumber(value.textBorderDashOffset), { 
					name: "Text Border Dash Offset",
					onuserchange: (v) => this.value.textBorderDashOffset = v
				}),
				text_border_type: new ve.Select({
					dashed: { name: "Dashed" },
					dotted: { name: "Dotted" },
					solid: { name: "Solid" },
				}, { 
					name: "Text Border Type",
					onuserchange: (v) => this.value.textBorderType = v,
					selected: value.textBorderType
				}),
				text_border_width: new ve.Number(Math.returnSafeNumber(value.textBorderWidth), { 
					name: "Text Border Width",
					onuserchange: (v) => this.value.textBorderWidth = v
				}),
				text_margin_x: new ve.Number((value.textMargin) ? 
					Math.returnSafeNumber(value.textMargin[0]) : 0, { 
					name: "Text Margin X",
					onuserchange: (v) => this.value.textMargin = [v, this.interface.text_style.text_margin_y.v]
				}),
				text_margin_y: new ve.Number((value.textMargin) ? 
					Math.returnSafeNumber(value.textMargin[1]) : 0, { 
					name: "Text Margin Y",
					onuserchange: (v) => this.value.textMargin = [this.interface.text_style.text_margin_x.v, v]
				}),
				text_shadow_blur: new ve.Number(Math.returnSafeNumber(value.textShadowBlur), { 
					name: "Text Shadow Blur",
					onuserchange: (v) => this.value.textShadowBlur = v
				}),
				text_shadow_offset_x: new ve.Number(Math.returnSafeNumber(value.textShadowOffsetX), { 
					name: "Text Shadow Offset X",
					onuserchange: (v) => this.value.textShadowOffsetX = v
				}),
				text_shadow_offset_y: new ve.Number(Math.returnSafeNumber(value.textShadowOffsetY), { 
					name: "Text Shadow Offset Y",
					onuserchange: (v) => this.value.textShadowOffsetY = v
				})
			}, { name: "Text Style" }),
			shadow_options: new ve.Interface({
				shadow_blur: new ve.Number(Math.returnSafeNumber(value.shadowBlur), { 
					name: "Shadow Blur",
					onuserchange: (v) => this.value.shadowBlur = v
				}),
				shadow_colour: new ve.Colour((value.shadowColor) ? value.shadowColor : "#000000", { 
					name: "Shadow Colour",
					onuserchange: (v) => this.value.shadowColor = v
				}),
				shadow_offset_x: new ve.Number(Math.returnSafeNumber(value.shadowOffsetX), { 
					name: "Shadow Offset X",
					onuserchange: (v) => this.value.shadowOffsetX = v
				}),
				shadow_offset_y: new ve.Number(Math.returnSafeNumber(value.shadowOffsetY), { 
					name: "Shadow Offset Y",
					onuserchange: (v) => this.value.shadowOffsetY = v
				})
			}, { name: "Shadow" })
		}, { name: (this.options.name) ? this.options.name : "Label Symbol" });
		this.interface.bind(this.element);
		this.value = value;
	}
};

//Functional binding

/**
 * @returns {ve.DatavisSuite.LabelSymbol}
 */
veDatavisSuiteLabelSymbol = function () {
	//Return statement
	return new ve.DatavisSuite.LabelSymbol(...arguments);
};