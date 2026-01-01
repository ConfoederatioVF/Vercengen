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
			let io = {
				onuserchange: () => this.fireToBinding()
			};
		this.interface = new ve.Interface({
			text_options: new ve.Interface({
				show: new ve.Toggle(false, { name: "Show", ...io }),
				
				colour: new ve.Colour("#ffffff", { name: "Colour", ...io }),
				formatter: new ve.Text("", { name: "Formatter", ...io }),
				font_family: new ve.Text("sans-serif", { name: "Font Family", ...io }),
				font_size: new ve.Number(12, { min: 0, name: "Font Size", ...io }),
				font_style: new ve.Select({
					normal: { name: "Normal", selected: true },
					italic: { name: "Italic" },
					oblique: { name: "Oblique" }
				}, { name: "Font Style", ...io }),
				font_weight: new ve.Select({
					light: { name: "Light" },
					normal: { name: "Normal", selected: true },
					bolder: { name: "Medium" },
					bold: { name: "Bold" }
				}, { name: "Font Weight", ...io }),
				height: new ve.Number(50, { min: 0, name: "Height", ...io }),
				width: new ve.Number(100, { min: 0, name: "Width", ...io })
			}, { name: "Text Options" }),
			text_style: new ve.Interface({
				background_colour: new ve.Colour("#000000", { name: "Background Colour", ...io }),
				background_colour_opacity: new ve.Range(0, { name: "Background Colour Opacity", ...io }),
				border_colour: new ve.Colour("#000000", { name: "Border Colour", ...io }),
				border_dash_offset: new ve.Number(0, { name: "Border Dash Offset", ...io }),
				border_radius: new ve.Number(0, { name: "Border Radius", ...io }),
				border_type: new ve.Select({
					dashed: { name: "Dashed" },
					dotted: { name: "Dotted" },
					solid: { name: "Solid", selected: true },
				}, { name: "Border Type", ...io }),
				border_width: new ve.Number(0, { name: "Border Width", ...io }),
				distance: new ve.Number(5, { name: "Distance", ...io }),
				ellipsis: new ve.Text("...", { name: "Ellipsis", ...io }),
				line_height: new ve.Number(12, { min: 0, name: "Line Height", ...io }),
				offset_x: new ve.Number(0, { name: "Offset X", ...io }),
				offset_y: new ve.Number(0, { name: "Offset Y", ...io }),
				overflow: new ve.Select({
					break: { name: "Break" },
					breakAll: { name: "Break All" },
					none: { name: "None", selected: true },
					truncate: { name: "Truncate" }
				}, { name: "Overflow", ...io }),
				min_margin: new ve.Number(0, { name: "Minimum Margin", ...io }),
				padding: new ve.List([new ve.Number(0)], { min: 1, max: 4, name: "Padding", ...io }),
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
					top: { name: "Top", selected: true }
				}, { name: "Position", ...io }),
				rotate: new ve.Number(0, { name: "Rotate", ...io }),
				text_align_horizontal: new ve.Select({
					left: { name: "Left", selected: true },
					center: { name: "Centre" },
					right: { name: "Right" }
				}, { name: "Text Align (Horizontal)", ...io }),
				text_align_vertical: new ve.Select({
					top: { name: "Top" },
					middle: { name: "Middle", selected: true },
					bottom: { name: "Bottom" }
				}, { name: "Text Align (Vertical)", ...io }),
				text_border_colour: new ve.Colour("#000000", { name: "Text Border Colour", ...io }),
				text_border_dash_offset: new ve.Number(0, { name: "Text Border Dash Offset", ...io }),
				text_border_type: new ve.Select({
					dashed: { name: "Dashed" },
					dotted: { name: "Dotted" },
					solid: { name: "Solid", selected: true },
				}, { name: "Text Border Type", ...io }),
				text_border_width: new ve.Number(0, { name: "Text Border Width", ...io }),
				text_margin_x: new ve.Number(0, { name: "Text Margin X", ...io }),
				text_margin_y: new ve.Number(0, { name: "Text Margin Y", ...io }),
				text_shadow_blur: new ve.Number(0, { name: "Text Shadow Blur", ...io }),
				text_shadow_offset_x: new ve.Number(0, { name: "Text Shadow Offset X", ...io }),
				text_shadow_offset_y: new ve.Number(0, { name: "Text Shadow Offset Y", ...io })
			}, { name: "Text Style" }),
			shadow_options: new ve.Interface({
				shadow_enabled: new ve.Toggle(false, { name: "Shadow Enabled", ...io }),
				
				shadow_blur: new ve.Number(0, { name: "Shadow Blur", ...io }),
				shadow_colour: new ve.Colour("#000000", { name: "Shadow Colour", ...io }),
				shadow_offset_x: new ve.Number(0, { name: "Shadow Offset X", ...io }),
				shadow_offset_y: new ve.Number(0, { name: "Shadow Offset Y", ...io })
			}, { name: "Shadow" })
		}, { name: (options.name) ? options.name : "Label Symbol" });
		this.interface.bind(this.element);
		this.from_binding_fire_silently = true;
		this.v = value;
		delete this.from_binding_fire_silently;
	}
	
	get v () {
		//Declare local instance variables
		let ui_obj = {
			...this.interface.text_options.v,
			...this.interface.text_style.v,
			...(this.interface.shadow_options.shadow_enabled.v) ? 
				this.interface.shadow_options.v : {}
		};
		
		//Return statement
		return {
			show: ui_obj.show.v,
			color: ui_obj.colour.v,
			formatter: ui_obj.formatter.v,
			fontFamily: ui_obj.font_family.v,
			fontSize: ui_obj.font_size.v,
			fontStyle: ui_obj.font_style.v,
			fontWeight: ui_obj.font_weight.v,
			height: ui_obj.height.v,
			width: ui_obj.width.v,
			
			backgroundColor: Colour.convertRGBAToHex([...ui_obj.background_colour.v, ui_obj.background_colour_opacity.v*255]),
			borderColor: ui_obj.border_colour.v,
			borderDashOffset: ui_obj.border_dash_offset.v,
			borderRadius: ui_obj.border_radius.v,
			borderType: ui_obj.border_type.v,
			borderWidth: ui_obj.border_width.v,
			distance: ui_obj.distance.v,
			ellipsis: ui_obj.ellipsis.v,
			lineHeight: ui_obj.line_height.v,
			offset: [ui_obj.offset_x.v, ui_obj.offset_y.v],
			overflow: ui_obj.overflow.v,
			minMargin: ui_obj.min_margin.v,
			padding: ui_obj.padding.v.map((v) => v.v),
			align: ui_obj.text_align_horizontal.v,
			verticalAlign: ui_obj.text_align_vertical.v,
			textBorderColor: ui_obj.text_border_colour.v,
			textBorderDashOffset: ui_obj.text_border_dash_offset.v,
			textBorderType: ui_obj.text_border_type.v,
			textBorderWidth: ui_obj.text_border_width.v,
			textMargin: [ui_obj.text_margin_x.v, ui_obj.text_margin_y.v],
			textShadowBlur: ui_obj.text_shadow_blur.v,
			textShadowOffsetX: ui_obj.text_shadow_offset_x.v,
			textShadowOffsetY: ui_obj.text_shadow_offset_y.v,
			
			shadow_enabled: ui_obj?.shadow_enabled.v,
			shadowBlur: ui_obj?.shadow_blur.v,
			shadowColour: ui_obj?.shadow_colour.getHex(),
			shadowOffsetX: ui_obj?.shadow_offset_x.v,
			shadowOffsetY: ui_obj?.shadow_offset_y.v
		};
	}
	
	set v (arg0_value) { //[WIP] - Finish function body
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		
		//Declare local instance variables
		let text_options = this.interface.text_options;
		let text_style = this.interface.text_style;
		let shadow_options = this.interface.shadow_options;
		
		//Parse value
		if (value.show !== undefined) text_options.show.v = value.show;
		if (value.color !== undefined) text_options.colour.v = value.color;
		if (value.formatter !== undefined) text_options.formatter.v = value.formatter;
		if (value.fontFamily !== undefined) text_options.font_family.v = value.fontFamily;
		if (value.fontSize !== undefined) text_options.font_size.v = value.fontSize;
		if (value.fontWeight !== undefined) text_options.font_weight.v = value.fontWeight;
		if (value.height !== undefined) text_options.height.v = value.height;
		if (value.width !== undefined) text_options.width.v = value.width;
		
		
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