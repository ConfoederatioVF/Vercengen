ve.DatavisSuite.TooltipSymbol = class extends ve.Component {
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		let options = (arg1_options) ? arg1_options : {};
			super(options);
		
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-datavis-suite-tooltip-symbol");
			this.element.instance = this;
			HTML.setAttributesObject(this.element, options.attributes);
		this.options = options;
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
			show: new ve.Toggle(value.show, {
				name: "Show",
				onuserchange: (v) => this.value.show = v
			}),
			trigger: new ve.Select({
				axis: { name: "Axis" },
				item: { name: "Item" },
				none: { name: "None" }
			}, {
				name: "Trigger",
				onuserchange: (v) => this.value.trigger = v
			}),
			
			always_show_content: new ve.Toggle(value.alwaysShowContent, {
				name: "Always Show Content",
				onuserchange: (v) => this.value.alwaysShowContent = v
			}),
			_class_name: new ve.Text(value.className, {
				name: "Class Name",
				onuserchange: (v) => this.value.className = v
			}),
			confine: new ve.Toggle(value.confine, {
				name: "Confine",
				onuserchange: (v) => this.value.confine = v
			}),
			display_transition: new ve.Toggle((value.displayTransition !== undefined) ? true : value.displayTransition, {
				name: "Display Transition",
				onuserchange: (v) => this.value.displayTransition = v
			}),
			enterable: new ve.Toggle((value.enterable !== undefined) ? true : value.enterable, {
				name: "Enterable",
				onuserchange: (v) => this.value.enterable = v
			}),
			hide_delay: new ve.Number(Math.returnSafeNumber(value.hideDelay, 100), {
				name: "Hide Delay",
				onuserchange: (v) => this.value.hideDelay = v
			}),
			position: new ve.RawInterface({
				position_x: new ve.Text(value.position?.[0], {
					name: "X"
				}),
				position_y: new ve.Text(value.position?.[1], {
					name: "Y"
				})
			}, {
				name: "Position",
				onuserchange: (v) => {
					if (v.position_x.v === "" && v.position_y.v === "") {
						delete value.position;
						return;
					}
					if (!isNaN(parseFloat(v.position_x.v))) v.position_x.v = parseFloat(v.position_x.v);
					if (!isNaN(parseFloat(v.position_y.v))) v.position_y.v = parseFloat(v.position_y.v);
					
					this.value.position = [v.position_x.v, v.position_y.v];
				}
			}),
			show_content: new ve.Toggle((value.showContent !== undefined) ? true : value.showContent, {
				name: "Show Content",
				onuserchange: (v) => this.value.showContent = v
			}),
			show_delay: new ve.Number(Math.returnSafeNumber(value.showDelay), {
				name: "Show Delay",
				onuserchange: (v) => this.value.showDelay = v
			}),
			transition_duration: new ve.Number(Math.returnSafeNumber(value.transitionDuration, 0.4), {
				name: "Transition Duration",
				onuserchange: (v) => this.value.transitionDuration = v
			}),
			trigger_on: new ve.Select({
				"click": { name: "Click" },
				"mousemove": { name: "Mousemove" },
				"mousemove|click": { name: "Mousemove, Click" },
				"none": { name: "None" }
			}, {
				name: "Trigger On",
				selected: (this.value.triggerOn) ? this.value.triggerOn : "mousemove|click",
				onuserchange: (v) => this.value.triggerOn = v
			}),
			render_mode: new ve.Select({
				"html": { name: "HTML" },
				"richText": { name: "Rich Text" }
			}, {
				name: "Render Mode",
				selected: (this.value.renderMode) ? this.value.renderMode : "html",
				onuserchange: (v) => this.value.renderMode = v
			}),
			
			axis_pointer: new ve.Interface({
				show: new ve.Toggle(value.axisPointer?.show, {
					name: "Show",
					onuserchange: (v) => {
						if (!this.value.axisPointer) this.value.axisPointer = {};
						this.value.axisPointer.show = v;
					}
				}),
				label_symbol: new ve.DatavisSuite.LabelSymbol(value.axisPointer?.label, {
					name: "Label Symbol",
					onuserchange: (v) => {
						if (!this.value.axisPointer) this.value.axisPointer = {};
						this.value.axisPointer.label = v;
					}
				}),
				on_hover_emphasis: new ve.Toggle(value.axisPointer?.triggerEmphasis, {
					name: "Onhover Emphasis",
					onuserchange: (v) => {
						if (!this.value.axisPointer) this.value.axisPointer = {};
						this.value.axisPointer.triggerEmphasis = v;
					}
				}),
				on_hover_tooltip: new ve.Toggle(value.axisPointer?.triggerTooltip, {
					name: "Onhover Tooltip",
					onuserchange: (v) => {
						if (!this.value.axisPointer) this.value.axisPointer = {};
						this.value.axisPointer.triggerTooltip = v;
					}
				}),
				shadow_blur: new ve.Number(Math.returnSafeNumber(value.axisPointer?.shadowStyle?.shadowBlur, 0), {
					name: "Shadow Blur",
					onuserchange: (v) => {
						if (!this.value.axisPointer) this.value.axisPointer = {};
						if (!this.value.axisPointer.shadowStyle) this.value.axisPointer.shadowStyle = {};
						this.value.axisPointer.shadowStyle.shadowBlur = v;
					}
				}),
				shadow_colour: new ve.Colour((value.axisPointer?.shadowStyle?.shadowColor) ? value.axisPointer.shadowStyle.shadowColor : "#000", {
					name: "Shadow Colour",
					onuserchange: (v) => {
						if (!this.value.axisPointer) this.value.axisPointer = {};
						if (!this.value.axisPointer.shadowStyle) this.value.axisPointer.shadowStyle = {};
						this.value.axisPointer.shadowStyle.shadowColor = v;
					}
				}),
				shadow_offset_x: new ve.Number(Math.returnSafeNumber(value.axisPointer?.shadowStyle?.shadowOffsetX), {
					name: "Shadow Offset X",
					onuserchange: (v) => {
						if (!this.value.axisPointer) this.value.axisPointer = {};
						if (!this.value.axisPointer.shadowStyle) this.value.axisPointer.shadowStyle = {};
						this.value.axisPointer.shadowStyle.shadowOffsetX = v;
					}
				}),
				shadow_offset_y: new ve.Number(Math.returnSafeNumber(value.axisPointer?.shadowStyle?.shadowOffsetY), {
					name: "Shadow Offset Y",
					onuserchange: (v) => {
						if (!this.value.axisPointer) this.value.axisPointer = {};
						if (!this.value.axisPointer.shadowStyle) this.value.axisPointer.shadowStyle = {};
						this.value.axisPointer.shadowStyle.shadowOffsetY = v;
					}
				}),
				snap_to: new ve.Toggle(value.axisPointer?.shadowStyle?.snap, {
					name: "Snap To",
					onuserchange: (v) => {
						if (!this.value.axisPointer) this.value.axisPointer = {};
						this.value.axisPointer.snap = v;
					}
				}),
				status: new ve.Toggle(value.axisPointer?.status, {
					name: "Status",
					onuserchange: (v) => {
						if (!this.value.axisPointer) this.value.axisPointer = {};
						this.value.axisPointer.status = v;
					}
				}),
				stroke_symbol: new ve.DatavisSuite.StrokeSymbol(value.axisPointer?.lineStyle, {
					name: "Stroke Symbol",
					onuserchange: (v) => {
						if (!this.value.axisPointer) this.value.axisPointer = {};
						this.value.axisPointer.lineStyle = v;
					}
				}),
				type: new ve.Select({
					line: { name: "Line" },
					shadow: { name: "Shadow" },
					none: { name: "None" }
				}, {
					name: "Type",
					onuserchange: (v) => {
						if (!this.value.axisPointer) this.value.axisPointer = {};
						this.value.axisPointer.type = v;
					}
				}),
				value: new ve.Number(Math.returnSafeNumber(this.value?.axisPointer?.value), {
					name: "Value",
					onuserchange: (v) => {
						if (!this.value.axisPointer) this.value.axisPointer = {};
						this.value.axisPointer.value = v;
					}
				}),
				z_index: new ve.Number(Math.returnSafeNumber(this.value?.axisPointer?.z), {
					name: "Z-Index",
					onuserchange: (v) => {
						if (!this.value.axisPointer) this.value.axisPointer = {};
						this.value.axisPointer.z = v;
					}
				})
			}, {
				name: "Axis Pointer"
			}),
			background_colour: new ve.Colour((value.backgroundColor) ? value.backgroundColor : [50, 50, 50], {
				name: "Background Colour",
				onuserchange: (v, e) => this.value.backgroundColor = e.getHex()
			}),
			background_opacity: new ve.Range(Math.returnSafeNumber(value.backgroundOpacity, 0.7*100), {
				name: "Background Opacity",
				min: 0,
				max: 100,
				onuserchange: (v) => this.value.backgroundOpacity = v/100
			}),
			border_colour: new ve.Colour((value.borderColor) ? value.borderColor : "#333333", {
				name: "Border Colour",
				onuserchange: (v, e) => this.value.borderColor = e.getHex()
			}),
			border_width: new ve.Number(Math.returnSafeNumber(value.borderWidth, 0), {
				name: "Border Width",
				onuserchange: (v) => this.value.borderWidth = v
			}),
			formatter: new ve.RawInterface({
				formatter: new ve.Text(value.formatter, {
					name: "Formatter"
				}),
				formatter_information: new ve.Button(() => {}, {
					name: "<icon>info</icon>",
					tooltip: `{a} = Series Name<br>{b} = Name of a data item<br>{c} = Value of a data item<br>{@xxx} - The value of a dimension named 'xxx'<br>{@[n]} - The value of a dimension at the index of n.`,
					
					style: { marginLeft: "var(--padding)" }
				})
			}),
			order: new ve.Select({
				seriesAsc: { name: "Series Ascending" },
				seriesDesc: { name: "Series Descending" },
				valueAsc: { name: "Value Ascending" },
				valueDesc: { name: "Value Descending" }
			}, {
				name: "Order",
				selected: (value.order) ? value.order : "seriesAsc",
				onuserchange: (v) => this.value.order = v
			}),
			padding: new ve.Number((value.padding) ? value.padding : [0], {
				name: "Padding",
				onuserchange: (v) => this.value.padding = v
			}),
			text_symbol: new ve.DatavisSuite.TextSymbol(value.textStyle, {
				name: "Text Symbol",
				onuserchange: (v) => this.value.textSymbol = v
			})
		}, { 
			name: (this.options.name) ? this.options.name : "Tooltip Symbol",
			onuserchange: (v, e) => {
				delete this.do_not_fire_to_binding;
				this.fireToBinding();
			}
		});
	}
}