ve.DatavisSuite.SeriesSymbol = class extends ve.Component {
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		let options = (arg1_options) ? arg1_options : {};
			super(options);
		
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-datavis-suite-series-symbol");
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
		
		//Declare local instance variables
		let components_obj = {};
		
		//Series type selection
		if (!value.type) value.type = "line";
		if (value.type === "line") {
			components_obj = {};
		} else if (value.type === "bar") {
			components_obj = {
				interface: new ve.Interface({
					bar_category_gap: new ve.Text(value.barCategoryGap, {
						name: "Bar Category Gap",
						parse_number: true,
						onuserchange: (v) => this.value.barCategoryGap = v
					}),
					bar_gap: new ve.Text((value.barGap) ? value.barGap : "20%", {
						name: "Bar Gap",
						parse_number: true,
						onuserchange: (v) => this.value.barGap = v
					}),
					bar_max_width: new ve.Text(value.barMaxWidth, {
						name: "Bar Max Width",
						parse_number: true,
						onuserchange: (v) => this.value.barMaxWidth = v
					}),
					bar_min_angle: new ve.Text(value.barMinAngle, {
						name: "Bar Min Angle",
						parse_number: true,
						onuserchange: (v) => this.value.barMinAngle = v
					}),
					bar_min_height: new ve.Text(value.barMinHeight, {
						name: "Bar Min Height",
						parse_number: true,
						onuserchange: (v) => this.value.barMinHeight = v
					}),
					bar_min_width: new ve.Text(value.barMinWidth, {
						name: "Bar Min Width",
						parse_number: true,
						onuserchange: (v) => this.value.barMinWidth = v
					}),
					bar_width: new ve.Text(value.barWidth, {
						name: "Bar Width",
						parse_number: true,
						onuserchange: (v) => this.value.barWidth = v
					}),
					round_cap: new ve.Toggle(value.roundCap, {
						name: "Round Cap",
						onuserchange: (v) => this.value.roundCap = v
					}),
					show_background: new ve.Toggle(value.showBackground, {
						name: "Show Background",
						onuserchange: (v) => this.value.showBackground = v
					})
				}, { name: "Bar Symbol" })
			};
		} else if (value.type === "pie") {
			components_obj = {
				interface: new ve.Interface({
					clockwise: new ve.Toggle(value.clockwise, {
						name: "Clockwise",
						onuserchange: (v) => this.value.clockwise = v
					}),
					empty_circle_style: new ve.DatavisSuite.StrokeSymbol(value.emptyCircleStyle, {
						name: "Empty Circle Symbol",
						onuserchange: (v) => this.value.emptyCircleStyle = v
					}),
					end_angle: new ve.Number(Math.returnSafeNumber(value.endAngle), {
						name: "End Angle",
						onuserchange: (v) => this.value.endAngle = v
					}),
					min_angle: new ve.Number(Math.returnSafeNumber(value.minAngle), {
						name: "Min Angle",
						onuserchange: (v) => this.value.minAngle = v
					}),
					min_show_label_angle: new ve.Number(Math.returnSafeNumber(value.minShowLabelAngle), {
						name: "Min Show Label Angle",
						onuserchange: (v) => this.value.minShowLabelAngle = v
					}),
					rose_type: new ve.Select({
						area: { name: "Area" },
						"false": { name: "False" },
						"true": { name: "True" },
						radius: { name: "Radius" }
					}, {
						name: "Rose Type",
						selected: (value.roseType === false) ? "false" : 
							(value.roseType === true) ? "true" : 
							value.roseType,
						onuserchange: (v) => {
							if (v === "false") v = false;
							if (v === "true") v = true;
							this.value.roseType = v;
						}
					}),
					pad_angle: new ve.Number(Math.returnSafeNumber(value.padAngle), {
						name: "Pad Angle",
						onuserchange: (v) => this.value.padAngle = v
					}),
					start_angle: new ve.Number(Math.returnSafeNumber(value.startAngle, 90), {
						name: "Start Angle",
						onuserchange: (v) => this.value.startAngle = v
					}),
					
					behaviour: new ve.Interface({
						avoid_label_overlap: new ve.Toggle(value.avoidLabelOverlap, {
							name: "Avoid Label Overlap",
							onuserchange: (v) => this.value.avoidLabelOverlap = v
						}),
						cursor: new ve.Text((value.cursor) ? value.cursor : "pointer", {
							name: "Cursor",
							onuserchange: (v) => this.value.cursor = v
						}),
						percent_precision: new ve.Number(Math.returnSafeNumber(value.percentPrecision, 2), {
							name: "Percent Precision",
							onuserchange: (v) => this.value.percentPrecision = v
						}),
						show_empty_circle: new ve.Toggle(value.showEmptyCircle, {
							name: "Show Empty Circle",
							onuserchange: (v) => this.value.showEmptyCircle = v
						}),
						still_show_zero_sum: new ve.Toggle(value.stillShowZeroSum, {
							name: "Still Show Zero Sum",
							onuserchange: (v) => this.value.stillShowZeroSum = v
						})
					}, { name: "Behaviour" }),
					
					events: new ve.Interface({
						selected_offset: new ve.Number(Math.returnSafeNumber(value.selectedOffset, 10), {
							name: "Selected Offset",
							onuserchange: (v) => this.value.selectedOffset = v
						})
					}, { name: "Events" })
				}, { name: "Pie Symbol" })
			};
		}
		
		//Parse value
		this.element.innerHTML = "";
		this.interface = new ve.Interface({
			colour: new ve.Colour((value.color) ? value.color : [255, 255, 255, 1], {
				is_rgba: true,
				onuserchange: (v, e) => this.value.color = e.getHex()
			}),
			_name: new ve.Text(value.name, {
				name: "Name",
				onuserchange: (v) => this.value.name = v
			}),
			type: new ve.Select({
				line: { name: "Line" },
				bar: { name: "Bar" },
				pie: { name: "Pie" }
			}, {
				name: "Type",
				selected: (value.type) ? value.type : "line",
				onuserchange: (v) => {
					this.value.type = v;
					this.v = this.value; //Reload interface
				}
			}),
			...components_obj,
			
			animation: new ve.Interface({
				delay: new ve.Number(Math.returnSafeNumber(value.animationDelay), {
					name: "Delay",
					onuserchange: (v) => this.value.animationDelay = v
				}),
				delay_update: new ve.Number(Math.returnSafeNumber(value.animationDelayUpdate, 300), {
					name: "Delay Update",
					onuserchange: (v) => this.value.animationDelayUpdate = v
				}),
				duration: new ve.Number(Math.returnSafeNumber(value.animationDuration, 1000), {
					name: "Duration",
					onuserchange: (v) => this.value.animationDuration = v
				}),
				duration_update: new ve.Number(Math.returnSafeNumber(value.animationDurationUpdate, 300), {
					name: "Duration Update",
					onuserchange: (v) => this.value.animationDurationUpdate = v
				}),
				easing: new ve.Select({
					linear: { name: "Linear" },
					quadraticIn: { name: "Quadratic In" },
					quadraticOut: { name: "Quadratic Out" },
					quadraticInOut: { name: "Quadratic In Out" },
					cubicIn: { name: "Cubic In" },
					cubicOut: { name: "Cubic Out" },
					cubicInOut: { name: "Cubic In Out" },
					quarticIn: { name: "Quartic In" },
					quarticOut: { name: "Quartic Out" },
					quarticInOut: { name: "Quartic In Out" },
					quinticIn: { name: "Quintic In" },
					quinticOut: { name: "Quintic Out" },
					quinticInOut: { name: "Quintic In Out" },
					sinusoidalIn: { name: "Sinusoidal In" },
					sinusoidalOut: { name: "Sinusoidal Out" },
					sinusoidalInOut: { name: "Sinusoidal In Out" },
					exponentialIn: { name: "Exponential In" },
					exponentialOut: { name: "Exponential Out" },
					exponentialInOut: { name: "Exponential In Out" },
					circularIn: { name: "Circular In" },
					circularOut: { name: "Circular Out" },
					circularInOut: { name: "Circular In Out" },
					elasticIn: { name: "Elastic In" },
					elasticOut: { name: "Elastic Out" },
					elasticInOut: { name: "Elastic In Out" },
					backIn: { name: "Back In" },
					backOut: { name: "Back Out" },
					backInOut: { name: "Back In Out" },
					bounceIn: { name: "Bounce In" },
					bounceOut: { name: "Bounce Out" },
					bounceInOut: { name: "Bounce In Out" }
				}, {
					name: "Easing",
					selected: (value.animationEasing) ? value.animationEasing : "linear",
					onuserchange: (v) => this.value.animationEasing = v
				}),
				easing_update: new ve.Select({
					linear: { name: "Linear" },
					quadraticIn: { name: "Quadratic In" },
					quadraticOut: { name: "Quadratic Out" },
					quadraticInOut: { name: "Quadratic In Out" },
					cubicIn: { name: "Cubic In" },
					cubicOut: { name: "Cubic Out" },
					cubicInOut: { name: "Cubic In Out" },
					quarticIn: { name: "Quartic In" },
					quarticOut: { name: "Quartic Out" },
					quarticInOut: { name: "Quartic In Out" },
					quinticIn: { name: "Quintic In" },
					quinticOut: { name: "Quintic Out" },
					quinticInOut: { name: "Quintic In Out" },
					sinusoidalIn: { name: "Sinusoidal In" },
					sinusoidalOut: { name: "Sinusoidal Out" },
					sinusoidalInOut: { name: "Sinusoidal In Out" },
					exponentialIn: { name: "Exponential In" },
					exponentialOut: { name: "Exponential Out" },
					exponentialInOut: { name: "Exponential In Out" },
					circularIn: { name: "Circular In" },
					circularOut: { name: "Circular Out" },
					circularInOut: { name: "Circular In Out" },
					elasticIn: { name: "Elastic In" },
					elasticOut: { name: "Elastic Out" },
					elasticInOut: { name: "Elastic In Out" },
					backIn: { name: "Back In" },
					backOut: { name: "Back Out" },
					backInOut: { name: "Back In Out" },
					bounceIn: { name: "Bounce In" },
					bounceOut: { name: "Bounce Out" },
					bounceInOut: { name: "Bounce In Out" }
				}, {
					name: "Easing Update",
					selected: (value.animationEasingUpdate) ? value.animationEasingUpdate : "cubicOut",
					onuserchange: (v) => this.value.animationEasingUpdate = v
				}),
				threshold: new ve.Number(Math.returnSafeNumber(value.threshold, 2000), {
					name: "Threshold",
					onuserchange: (v) => this.value.threshold = v
				}),
				toggle_universal_transition: new ve.Toggle(value.universalTransition, {
					name: "Toggle Universal Transition",
					onuserchange: (v) => value.universalTransition = v
				}),
				universal_transition: new ve.Interface({
					enabled: new ve.Toggle(value.universalTransition?.enabled, {
						name: "Enabled",
						onuserchange: (v) => {
							if (!this.value.universalTransition) this.value.universalTransition = {};
							this.value.universalTransition.enabled = v;
						}
					}),
					
					delay: new ve.Number(Math.returnSafeNumber(value.universalTransition?.delay), {
						name: "Delay",
						onuserchange: (v) => {
							if (!this.value.universalTransition) this.value.universalTransition = {};
							this.value.universalTransition.delay = v;
						}
					}),
					divide_shape: new ve.Select({
						clone: { name: "Clone" },
						split: { name: "Split" }
					}, {
						name: "Divide Shape",
						selected: (value.universalTransition?.divideShape) ? value.universalTransition.divideShape : "clone",
						onuserchange: (v) => {
							if (!this.value.universalTransition) this.value.universalTransition = {};
							this.value.universalTransition.divideShape = v;
						}
					}),
					series_key: new ve.Text((value.universalTransition?.seriesKey) ? value.universalTransition.seriesKey : [""], {
						onuserchange: (v) => {
							if (!this.value.universalTransition) this.value.universalTransition = {};
							this.value.universalTransition.seriesKey = v;
						}
					})
				}, { name: "Universal Transition" })
			}, { name: "Animation" }),
			behaviour: new ve.Interface({
				colour_scheme: new ve.Select({
					data: { name: "Data" },
					series: { name: "Series" }
				}, {
					name: "Colour Scheme",
					selected: (value.colorBy) ? value.colorBy : "data",
					onuserchange: (v) => this.value.colorBy = v
				}),
				interactive: new ve.Toggle(value.silent, {
					name: "Interactive",
					onuserchange: (v) => this.value.silent = v
				}),
				interpolate: new ve.Number(Math.returnSafeNumber(value.interpolate), {
					name: "Interpolate",
					onuserchange: (v) => this.value.interpolate = v
				}),
				sampling: new ve.Select({
					average: { name: "Average" },
					max: { name: "Max" },
					min: { name: "Min" },
					minmax: { name: "Minmax" },
					lttb: { name: "LTTB" },
					sum: { name: "Sum" },
					undefined: { name: "None" }
				}, {
					name: "Sampling",
					selected: (value.sampling) ? value.sampling : "undefined",
					onuserchange: (v) => {
						if (v === "undefined") {
							delete this.value.sampling;
							return;
						}
						this.value.sampling = v;
					}
				}),
				smoothing: new ve.Select({
					x: { name: "X" },
					y: { name: "Y" },
					undefined: { name: "None" }
				}, {
					name: "Smoothing",
					selected: (value.smoothing) ? value.smoothing : "undefined",
					onuserchange: (v) => {
						if (v === "undefined") {
							delete this.value.smoothing;
							return;
						}
						this.value.selected = v;
					}
				}),
				z_index: new ve.Number(Math.returnSafeNumber(value.z), {
					name: "Z Index",
					onuserchange: (v) => this.value.z = v
				})
			}, { name: "Behaviour" }),
			behaviour_advanced: new ve.Interface({
				blend_mode: new ve.Select({
					lighter: { name: "Lighter" },
					"source-over": { name: "Source-Over" }
				}, {
					name: "Blend Mode",
					selected: (value.blendMode) ? value.blendMode : "source-over",
					onuserchange: (v) => this.value.blendMode = v
				}),
				cursor: new ve.Text((value.cursor) ? value.cursor : "pointer", {
					name: "Cursor",
					onuserchange: (v) => this.value.cursor = v
				}),
				hover_layer_threshold: new ve.Number(Math.returnSafeNumber(value.hoverLayerThreshold, 3000), {
					name: "Hover Layer Threshold",
					onuserchange: (v) => this.value.hoverLayerThreshold = v
				}),
				rich_text_inherits_plain_label: new ve.Toggle(value.richInheritPlainLabel, {
					name: "Rich Text Inherits Plain Label",
					onuserchange: (v) => this.value.richInheritPlainLabel = v
				}),
				use_UTC: new ve.Toggle(value.useUTC, {
					name: "Use UTC",
					onuserchange: (v) => this.value.useUTC = v
				})
			}, { name: "Behaviour (Advanced) "}),
			behaviour_stack: new ve.Interface({
				stack: new ve.Text(value.stack, {
					name: "Stack",
					onuserchange: (v) => this.value.stack = v
				}),
				stack_mode: new ve.Select({
					all: { name: "All" },
					negative: { name: "Negative" },
					positive: { name: "Positive" },
					samesign: { name: "Same Sign" }
				}, {
					name: "Stack Mode",
					selected: (value.stackStrategy) ? value.stackStrategy : "samesign",
					onuserchange: (v) => this.value.stackStrategy = v
				}),
				stack_order: new ve.Select({
					seriesAsc: { name: "Series Ascending" },
					seriesDesc: { name: "Series Descending" }
				}, {
					name: "Stack Order",
					selected: (value.stackOrder) ? value.stackOrder : "seriesAsc",
					onuserchange: (v) => this.value.stackOrder = v
				})
			}, { name: "Behaviour (Stack)" }),
			coordinates: new ve.Interface({
				_height: new ve.Text((value.height) ? value.height : "auto", {
					name: "Height",
					onuserchange: (v) => {
						if (!isNaN(parseFloat(v))) v = parseFloat(v);
						this.value.height = v;
					}
				}),
				_width: new ve.Text((value.width) ? value.width : "auto", {
					name: "Width",
					onuserchange: (v) => {
						if (!isNaN(parseFloat(v))) v = parseFloat(v);
						this.value.width = v;
					}
				}),
				
				bottom: new ve.Text((value.bottom) ? value.bottom : "auto", {
					name: "Bottom",
					selected: (value.bottom) ? value.bottom : "auto",
					onuserchange: (v) => this.value.bottom = v
				}),
				left: new ve.Text((value.left) ? value.left : "auto", {
					name: "Left",
					selected: (value.left) ? value.left : "auto",
					onuserchange: (v) => this.value.left = v
				}),
				right: new ve.Text((value.right) ? value.right : "auto", {
					name: "Right",
					selected: (value.right) ? value.right : "auto",
					onuserchange: (v) => this.value.right = v
				}),
				top: new ve.Text((value.top) ? value.top : "auto", {
					name: "Top",
					selected: (value.top) ? value.top : "auto",
					onuserchange: (v) => this.value.top = v
				})
			}, { name: "Coordinates" }),
			coordinates_advanced: new ve.Interface({
				coordinate_system: new ve.Select({
					"cartesian2d": { name: "Cartesian 2D" },
					polar: { name: "Polar" }
				}, {
					name: "Coordinate System",
					selected: (value.coordinateSystem) ? value.coordinateSystem : "cartesian2d",
					onuserchange: (v) => this.value.coordinateSystem = v
				}),
				polar_index: new ve.Number(Math.returnSafeNumber(value.polarIndex), {
					name: "Polar Index",
					onuserchange: (v) => this.value.polarIndex = v
				}),
				x_axis_index: new ve.Number(Math.returnSafeNumber(value.xAxisIndex), {
					name: "X Axis Index",
					onuserchange: (v) => this.value.xAxisIndex = v
				}),
				y_axis_index: new ve.Number(Math.returnSafeNumber(value.yAxisIndex), {
					name: "Y Axis Index",
					onuserchange: (v) => this.value.yAxisIndex = v
				})
			}, { name: "Coordinates (Advanced)" }),
			coordinates_assignment: new ve.Interface({
				calendar_id: new ve.Number(Math.returnSafeNumber(value.calendarId), {
					name: "Calendar ID",
					onuserchange: (v) => this.value.calendarId = v
				}),
				calendar_index: new ve.Number(Math.returnSafeNumber(value.calendarIndex), {
					name: "Calendar Index",
					onuserchange: (v) => this.value.calendarIndex = v
				}),
				geo_id: new ve.Number(Math.returnSafeNumber(value.geoId), {
					name: "Geo IO",
					onuserchange: (v) => this.value.geoId = v
				}),
				geo_index: new ve.Number(Math.returnSafeNumber(value.geoIndex), {
					name: "Geo Index",
					onuserchange: (v) => this.value.geoIndex = v
				}),
				matrix_id: new ve.Number(Math.returnSafeNumber(value.matrixId), {
					name: "Matrix IO",
					onuserchange: (v) => this.value.matrixId = v
				}),
				matrix_index: new ve.Number(Math.returnSafeNumber(value.matrixIndex), {
					name: "Matrix Index",
					onuserchange: (v) => this.value.matrixIndex = v
				}),
			}, { name: "Coordinates (Assignment)" }),
			events: new ve.Interface({
				onblur: new ve.Interface({
					end_label_symbol: new ve.DatavisSuite.LabelSymbol(value.blur?.endLabel, {
						name: "End Label Symbol",
						onuserchange: (v) => {
							if (!this.value.blur) this.value.blur = {};
							this.value.blur.endLabel = v;
						}
					}).interface,
					fill_symbol: new ve.DatavisSuite.FillSymbol(value.blur?.areaStyle, {
						name: "Fill Symbol",
						onuserchange: (v) => {
							if (!this.value.blur) this.value.blur = {};
							this.value.blur.areaStyle = v;
						}
					}).interface,
					label_symbol: new ve.DatavisSuite.LabelSymbol(value.blur?.label, {
						name: "Label Symbol",
						onuserchange: (v) => {
							if (!this.value.blur) this.value.blur = {};
							this.value.blur.label = v;
						}
					}).interface,
					label_stroke_symbol: new ve.DatavisSuite.StrokeSymbol(value.blur?.labelLine?.lineStyle, {
						name: "Label Stroke Symbol",
						onuserchange: (v) => {
							if (!this.value.blur) this.value.blur = {};
							if (!this.value.blur.labelLine) this.value.blur.labelLine = {};
							this.value.blur.labelLine.lineStyle = v;
						}
					}).interface,
					point_symbol: new ve.DatavisSuite.PointSymbol(value.blur?.itemStyle, {
						name: "Point Symbol",
						onuserchange: (v) => {
							if (!this.value.blur) this.value.blur = {};
							this.value.blur.itemStyle = v;
						}
					}).interface,
					stroke_symbol: new ve.DatavisSuite.StrokeSymbol(value.blur?.lineStyle, {
						name: "Stroke Symbol",
						onuserchange: (v) => {
							if (!this.value.blur) this.value.blur = {};
							this.value.blur.lineStyle = v;
						}
					}).interface
				}, { name: "Onblur" }),
				onhover: new ve.Interface({
					focus: new ve.Select({
						self: { name: "Self" },
						series: { name: "Series" }
					}, {
						name: "Focus",
						selected: (value.emphasis?.focus) ? value.emphasis.focus : "series",
						onuserchange: (v) => {
							if (!this.value.emphasis) this.value.emphasis = {};
							this.value.emphasis.focus = v;
						}
					}),
					highlight: new ve.Toggle(value.emphasis?.legendHoverLink, {
						name: "Highlight",
						onuserchange: (v) => this.value.emphasis.legendHoverLink = v
					}),
					scale: new ve.Number(Math.returnSafeNumber(value.emphasis?.scale, 1.1), {
						name: "Scale",
						onuserchange: (v) => {
							if (!this.value.emphasis) this.value.emphasis = {};
							this.value.emphasis.scale = v;
						}
					}),
					
					blur_scope: new ve.Select({
						coordinateSystem: { name: "Coordinate System" },
						global: { name: "Global" },
						series: { name: "Series" }
					}, {
						name: "Blur Scope",
						selected: (value.emphasis?.blurScope) ? value.emphasis.blurScope : "coordinateSystem",
						onuserchange: (v) => {
							if (!this.value.emphasis) this.value.emphasis = {};
							this.value.emphasis.blurScope = v;
						}
					}),
					
					end_label_symbol: new ve.DatavisSuite.LabelSymbol(value.emphasis?.endLabel, {
						name: "End Label Symbol",
						onuserchange: (v) => {
							if (!this.value.emphasis) this.value.emphasis = {};
							this.value.emphasis.endLabel = v;
						}
					}).interface,
					fill_symbol: new ve.DatavisSuite.FillSymbol(value.emphasis?.areaStyle, {
						name: "Fill Symbol",
						onuserchange: (v) => {
							if (!this.value.emphasis) this.value.emphasis = {};
							this.value.emphasis.areaStyle = v;
						}
					}).interface,
					label_symbol: new ve.DatavisSuite.LabelSymbol(value.emphasis?.label, {
						name: "Label Symbol",
						onuserchange: (v) => {
							if (!this.value.emphasis) this.value.emphasis = {};
							this.value.emphasis.label = v;
						}
					}).interface,
					point_symbol: new ve.DatavisSuite.PointSymbol(value.emphasis?.itemStyle, {
						name: "Point Symbol",
						onuserchange: (v) => {
							if (!this.value.emphasis) this.value.emphasis = {};
							this.value.emphasis.itemStyle = v;
						}
					}).interface,
					stroke_symbol: new ve.DatavisSuite.StrokeSymbol(value.emphasis?.lineStyle, {
						name: "Stroke Symbol",
						onuserchange: (v) => {
							if (!this.value.emphasis) this.value.emphasis = {};
							this.value.emphasis.lineStyle = v;
						}
					}).interface
				}, { name: "Onhover" }),
				onselect: new ve.Interface({
					end_label_symbol: new ve.DatavisSuite.LabelSymbol(value.select?.endLabel, {
						name: "End Label Symbol",
						onuserchange: (v) => {
							if (!this.value.select) this.value.select = {};
							this.value.select.endLabel = v;
						}
					}).interface,
					fill_symbol: new ve.DatavisSuite.FillSymbol(value.select?.areaStyle, {
						name: "Fill Symbol",
						onuserchange: (v) => {
							if (!this.value.select) this.value.select = {};
							this.value.select.areaStyle = v;
						}
					}).interface,
					label_symbol: new ve.DatavisSuite.LabelSymbol(value.select?.label, {
						name: "Label Symbol",
						onuserchange: (v) => {
							if (!this.value.select) this.value.select = {};
							this.value.select.label = v;
						}
					}).interface,
					label_stroke_symbol: new ve.DatavisSuite.StrokeSymbol(value.select?.labelLine?.lineStyle, {
						name: "Label Stroke Symbol",
						onuserchange: (v) => {
							if (!this.value.select) this.value.select = {};
							if (!this.value.select.labelLine) this.value.select.labelLine = {};
							this.value.select.labelLine.lineStyle = v;
						}
					}).interface,
					point_symbol: new ve.DatavisSuite.PointSymbol(value.select?.itemStyle, {
						name: "Point Symbol",
						onuserchange: (v) => {
							if (!this.value.select) this.value.select = {};
							this.value.select.itemStyle = v;
						}
					}).interface,
					stroke_symbol: new ve.DatavisSuite.StrokeSymbol(value.select?.lineStyle, {
						name: "Stroke Symbol",
						onuserchange: (v) => {
							if (!this.value.select) this.value.select = {};
							this.value.select.lineStyle = v;
						}
					}).interface
				}, { name: "Onselect" })
			}, { name: "Events" }),
			fill_symbol: new ve.DatavisSuite.FillSymbol({
				...value.areaStyle,
				...value.backgroundStyle
			}, {
				name: "Fill Symbol",
				onuserchange: (v) => {
					this.value.areaStyle = v;
					this.value.backgroundStyle = v;
				}
			}).interface,
			stroke_symbol: new ve.DatavisSuite.StrokeSymbol(value.lineStyle, {
				name: "Stroke Symbol",
				onuserchange: (v) => this.value.lineStyle = v
			}).interface,
			tooltip: new ve.Interface({
				label_symbol: new ve.DatavisSuite.LabelSymbol(value.tooltip?.textStyle, {
					name: "Label Symbol",
					onuserchange: (v) => {
						if (!this.value.tooltip) this.value.tooltip = {};
						this.value.tooltip.textStyle = v;
					}
				}).interface,
				tooltip_symbol: new ve.DatavisSuite.TooltipSymbol(value.tooltip, {
					name: "Tooltip Symbol",
					onuserchange: (v) => {
						if (!this.value.tooltip) this.value.tooltip = {};
						this.value.tooltip = {
							...this.value.tooltip,
							...v
						};
					}
				}).interface
			}, { name: "Tooltip" }),
			optimisation: new ve.Interface({
				large: new ve.Toggle(value.large, {
					name: "Large",
					onuserchange: (v) => this.value.large = v
				}),
				large_threshold: new ve.Number(Math.returnSafeNumber(value.largeThreshold, 400), {
					name: "Large Threshold",
					onuserchange: (v) => this.value.largeThreshold = v
				}),
				progressive: new ve.Number(Math.returnSafeNumber(value.progressive, 5000), {
					name: "Progressive",
					onuserchange: (v) => this.value.progressive = v
				}),
				progressive_chunk_mode: new ve.Select({
					mod: { name: "Mod" },
					sequential: { name: "Sequential" }
				}, {
					name: "Progressive Chunk Mode",
					selected: (value.progressiveChunkMode) ? value.progressiveChunkMode : "mod",
					onuserchange: (v) => this.value.progressiveChunkMode = v
				}),
				progressive_threshold: new ve.Number(Math.returnSafeNumber(value.progressiveThreshold, 3000), {
					name: "Progressive Threshold",
					onuserchange: (v) => this.value.progressiveThreshold = v
				})
			}, { name: "Optimisation" })
		}, {
			name: (this.options.name) ? this.options.name : "Series Symbol",
			onuserchange: (v, e) => {
				delete this.do_not_fire_to_binding;
				this.fireToBinding();
			},
			open: true
		});
		this.interface.setOwner(this, [this]);
		this.interface.bind(this.element);
	}
};