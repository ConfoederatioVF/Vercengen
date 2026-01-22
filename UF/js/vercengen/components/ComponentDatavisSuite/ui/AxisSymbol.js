/**
 * Internal sub-component of <span color = "yellow">{@link ve.DatavisSuite}</span>.
 *
 * Please refer to <span color = "yellow">{@link ve.Component}</span> for methods or fields inherited from this Component's parent such as `.options.attributes` or `.element`.
 *
 * ##### Constructor:
 * - `arg0_value`: {@link Object}
 * - `arg1_options`: {@link Object}
 *   - `.datavis_suite_obj`: {@link ve.DatavisSuite} - The DatavisSuite that the X Axis Symbol is attached to.
 *   - `.graph_obj`: {@link ve.Graph} - The graph to bind the given symbol to.
 *   - `.name="<X/Y/Z> Axis Symbol"`: {@link string}
 */
ve.DatavisSuite.AxisSymbol = class extends ve.Component {
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		let options = (arg1_options) ? arg1_options : {};
			super(options);
		
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-datavis-suite-x-axis-symbol");
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
		let data_series = {};
		let position_obj = new ve.Select({
			top: { name: "Top" },
			bottom: { name: "Bottom" }
		}, {
			name: "Position",
			selected: (this.value.position) ? this.value.position : "bottom",
			onuserchange: (v) => this.value.position = v
		});
			if (this.options.axis_type === "y")
				position_obj = new ve.Select({
					left: { name: "Left" },
					right: { name: "Right" }
				}, {
					name: "Position",
					selected: (this.value.position) ? this.value.position : "left",
					onuserchange: (v) => this.value.position = v
				})
		
		if (this.options.datavis_suite_obj) {
			let datavis_suite_obj = this.options.datavis_suite_obj;
			
			let all_series_names = datavis_suite_obj.getAllSeriesNames();
			let series_options = {
				name: "Axis Ticks (Data Series)",
				tooltip: `Assigns a data series as axis ticks instead of manual inputs. Series is vertically aligned.`,
				selected: (this.value.data_series?.length > 0) ? all_series_names[this.value.data_series] : undefined,
				onuserchange: (v) => {
					if (v === "") {
						delete this.value.data_series;
						veToast(`Cleared data series from axis ticks.`);
						return;
					}
					if (!datavis_suite_obj.series[v]) {
						veToast(`<icon>warning</icon> The data series you have selected is not valid.`);
					} else {
						this.value.data = this.getDataSeries(v);
						this.value.data_series = v;
					}
				}
			};
			data_series.data_series = new ve.Datalist(all_series_names, series_options);
				data_series.placeholder = all_series_names;
		}
		
		//Parse value
		this.element.innerHTML = "";
		this.interface = new ve.Interface({
			x_axis_name: new ve.Text((value.name) ? value.name : "", {
				name: "Name",
				onuserchange: (v) => this.value.name = v
			}),
			name_gap: new ve.Number(Math.returnSafeNumber(value.name_gap, 15), {
				name: "Name Gap",
				onuserchange: (v) => this.value.nameGap = v
			}),
			name_location: new ve.Select({
				start: { name: "Start" },
				middle: { name: "Middle" },
				end: { name: "End" }
			}, {
				name: "Name Location",
				selected: (value.name_location) ? value.name_location : "end",
				onuserchange: (v) => this.value.nameEnd = v
			}),
			name_move_overlap: new ve.Toggle(value.nameMoveOverlap, {
				name: "Name Move Overlap",
				onuserchange: (v) => this.value.nameMoveOverlap = v
			}),
			name_rotate: new ve.Number(Math.returnSafeNumber(value.nameRotate, 0), {
				name: "Name Rotate",
				onuserchange: (v) => this.value.nameRotate = v
			}),
			type: new ve.Select({
				value: { name: "Value" },
				category: { name: "Category" },
				time: { name: "Time" },
				log: { name: "Log" }
			}, {
				name: "Type",
				selected: (value.type) ? value.type : "value",
				onuserchange: (v) => this.value.type = v
			}),
			
			data: new ve.Text((value.data) ? value.data : [""], {
				name: "Axis Ticks",
				onuserchange: (v) => {
					console.log("this.value.data", v);
					this.value.data = v;
				}
			}),
			...data_series,
			
			axis_label: new ve.Interface({
				show: new ve.Toggle(this.value.axisLabel?.show, {
					name: "Show Axis Label",
					onuserchange: (v) => {
						if (!this.value.axisLabel) this.value.axisLabel = {};
						this.value.axisLabel = v;
					}
				}),
				
				align_max_label: new ve.Select({
					left: { name: "Left" },
					center: { name: "Centre" },
					right: { name: "Right" },
					none: { name: "None" }
				}, {
					name: "Align Max Label",
					onuserchange: (v) => {
						if (!this.value.axisLabel) this.value.axisLabel = {};
						if (v !== "none") {
							this.value.axisLabel.alignMaxLabel = v;
						} else {
							this.value.axisLabel.alignMaxLabel = null;
						}
					}
				}),
				align_min_label: new ve.Select({
					left: { name: "Left" },
					center: { name: "Centre" },
					right: { name: "Right" },
					none: { name: "None" }
				}, {
					name: "Align Min Label",
					onuserchange: (v) => {
						if (!this.value.axisLabel) this.value.axisLabel = {};
						if (v !== "none") {
							this.value.axisLabel.alignMaxLabel = v;
						} else {
							this.value.axisLabel.alignMaxLabel = null;
						}
					}
				}),
				custom_values: new ve.Number((value.axisLabel?.customValues) ? value.axisLabel.customValues : [0], {
					name: "Custom Values",
					onuserchange: (v) => {
						if (!this.value.axisLabel) this.value.axisLabel = {};
						this.value.axisLabel.customValues = v;
					}
				}),
				formatter: new ve.Text((value.axisLabel?.formatter) ? value.axisLabel.formatter : "", {
					name: "Formatter",
					tooltip: `Valid variables include {extraZ}, {index}, {value}, as well as time variables (i.e. {YYYY}) for 'time' axis.`,
					onuserchange: (v) => {
						if (!this.value.axisLabel) this.value.axisLabel = {};
						this.value.axisLabel.formatter = v;
					}
				}),
				hide_overlap: new ve.Toggle((value.axisLabel?.hideOverlap !== undefined) ? value.axisLabel.hideOverlap : false, {
					name: "Hide Overlap",
					onuserchange: (v) => {
						if (!this.value.axisLabel) this.value.axisLabel = {};
						this.value.axisLabel.hideOverlap = v;
					}
				}),
				inside: new ve.Toggle((value.axisLabel?.inside !== undefined) ? value.axisLabel.inside : false, {
					name: "Inside",
					onuserchange: (v) => {
						if (!this.value.axisLabel) this.value.axisLabel = {};
						this.value.axisLabel.inside = v;
					}
				}),
				interval: new ve.Text((value.axisLabel?.interval !== undefined) ? value.axisLabel.interval : "auto", {
					name: "Interval",
					onuserchange: (v) => {
						if (!this.value.axisLabel) this.value.axisLabel = {};
						if (!isNaN(parseFloat(v))) v = parseFloat(v);
						this.value.axisLabel.interval = v;
					}
				}),
				margin: new ve.Number(Math.returnSafeNumber(value.axisLabel?.margin, 8), {
					name: "Margin",
					onuserchange: (v) => {
						if (!this.value.axisLabel) this.value.axisLabel = {};
						this.value.axisLabel.margin = v;
					}
				}),
				rotate: new ve.Number(Math.returnSafeNumber(value.axisLabel?.rotate, 0), {
					name: "Rotate",
					onuserchange: (v) => {
						if (!this.value.axisLabel) this.value.axisLabel = {};
						this.value.axisLabel.rotate = v;
					}
				}),
				show_max_label: new ve.Toggle(value.axisLabel?.showMaxLabel, {
					name: "Show Max Label",
					onuserchange: (v) => {
						if (!this.value.axisLabel) this.value.axisLabel = {};
						this.value.axisLabel.showMaxLabel = v;
					}
				}),
				show_min_label: new ve.Toggle(value.axisLabel?.showMinLabel, {
					name: "Show Min Label",
					onuserchange: (v) => {
						if (!this.value.axisLabel) this.value.axisLabel = {};
						this.value.axisLabel.showMinLabel = v;
					}
				}),
				label_symbol: new ve.DatavisSuite.LabelSymbol(value.axisLabel, {
					name: "Label Symbol",
					onuserchange: (v, e) => {
						if (!this.value.axisLabel) this.value.axisLabel = {};
						this.value.axisLabel = {
							...this.value.axisLabel,
							...e.value
						};
					}
				}).interface,
				stroke_symbol: new ve.DatavisSuite.StrokeSymbol(value.axisLabel, {
					name: "Stroke Symbol",
					onuserchange: (v, e) => {
						if (!this.value.axisLabel) this.value.axisLabel = {};
						this.value.axisLabel = {
							...this.value.axisLabel,
							...e.value
						};
					}
				}).interface
			}, {
				name: "Axis Label"
			}),
			axis_line: new ve.Interface({
				show: new ve.Toggle(value.axisLine?.show, {
					name: "Show",
					onuserchange: (v, e) => {
						if (!this.value.axisLine) this.value.axisLine = {};
						this.value.axisLine.show = v;
					}
				}),
				
				on_zero: new ve.Toggle(value.axisLine?.onZero, {
					name: "On Zero",
					onuserchange: (v) => {
						if (!this.value.axisLine) this.value.axisLine = {};
						this.value.axisLine.onZero = v;
					}
				}),
				on_zero_axis_index: new ve.Number(Math.returnSafeNumber(value.axisLine?.onZeroAxisIndex), {
					name: "On Zero Axis Index",
					onuserchange: (v) => {
						if (!this.value.axisLine) this.value.axisLine = {};
						this.value.axisLine.onZeroAxisIndex = v;
					}
				}),
				stroke_symbol: new ve.DatavisSuite.StrokeSymbol(Math.returnSafeNumber(value.axisLine?.lineStyle), {
					name: "Stroke Symbol",
					onuserchange: (v) => {
						if (!this.value.axisLine) this.value.axisLine = {};
						this.value.axisLine.lineStyle = v;
					}
				}).interface,
				symbol: new ve.Select({
					"none-none": { name: "None, None" },
					"arrow-arrow": { name: "Arrow, Arrow" },
					"arrow-none": { name: "Arrow, None" },
					"none-arrow": { name: "None, Arrow" }
				}, {
					selected: (value.axisLine?.symbol) ? value.axisLine.symbol.join("-") : "none-none",
					onuserchange: (v) => {
						if (!this.value.axisLine) this.value.axisLine = {};
						this.value.axisLine.symbol = v.split("-");
					}
				}),
				symbol_size: new ve.RawInterface({
					symbol_size_x: new ve.Number(Math.returnSafeNumber(value.axisLine?.symbolSize?.[0]), {
						name: "X"
					}),
					symbol_size_y: new ve.Number(Math.returnSafeNumber(value.axisLine?.symbolSize?.[1]), {
						name: "Y"
					})
				}, { 
					name: "Symbol Size",
					onuserchange: (v) => {
						if (!this.value.axisLine) this.value.axisLine = {};
						this.value.axisLine.symbolSize = [v.symbol_size_x.v, v.symbol_size_y.v];
					}
				}),
				symbol_offset: new ve.RawInterface({
					symbol_offset_x: new ve.Number(Math.returnSafeNumber(value.axisLine?.symbolOffset?.[0]), {
						name: "X"
					}),
					symbol_offset_y: new ve.Number(Math.returnSafeNumber(value.axisLine?.symbolOffset?.[1]), {
						name: "Y"
					})
				}, {
					name: "Symbol Offset",
					onuserchange: (v) => {
						if (!this.value.axisLine) this.value.axisLine = {};
						if (v.symbol_offset_x.v === 0 && v.symbol_offset_y.v === 0) return;
						this.value.axisLine.symbolOffset = [v.symbol_offset_x.v, v.symbol_offset_y.v];
					}
				})
			}, {
				name: "Axis Line"
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
				}).interface,
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
				}).interface,
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
			axis_tick: new ve.Interface({
				show: new ve.Toggle(this.value?.axisTick?.show, {
					name: "Show",
					onuserchange: (v) => {
						if (!this.value.axisTick) this.value.axisTick = {};
						this.value.axisTick.show = v;
					}
				}),
				align_with_label: new ve.Toggle(this.value?.axisTick?.alignWithLabel, {
					name: "Align with Label",
					onuserchange: (v) => {
						if (!this.value.axisTick) this.value.axisTick = {};
						this.value.axisTick.alignWithLabel = v;
					}
				}),
				custom_values: new ve.Number((this.value?.axisTick?.customValues) ? this.value.axisTick.customValues : [0], {
					name: "Custom Values",
					onuserchange: (v) => {
						if (!this.value.axisTick) this.value.axisTick = {};
						this.values.axisTick.customValues = v;
					}
				}),
				inside: new ve.Toggle(this.value?.axisTick?.inside, {
					name: "Inside",
					onuserchange: (v) => {
						if (!this.value.axisTick) this.value.axisTick = {};
						this.value.axisTick.inside = v;
					}
				}),
				interval: new ve.Text((value.axisTick?.interval !== undefined) ? value.axisTick.interval : "auto", {
					name: "Interval",
					onuserchange: (v) => {
						if (!this.value.axisTick) this.value.axisTick = {};
						if (!isNaN(parseFloat(v))) v = parseFloat(v);
						this.value.axisTick.interval = v;
					}
				}),
				length: new ve.Number(Math.returnSafeNumber(value.axisTick?.length, 5), {
					name: "Length",
					onuserchange: (v) => {
						if (!this.value.axisTick) this.value.axisTick = {};
						this.value.axisTick.length = v;
					}
				}),
				stroke_symbol: new ve.DatavisSuite.StrokeSymbol(value.axisTick?.lineStyle, {
					name: "Stroke Symbol",
					onuserchange: (v) => {
						if (!this.value.axisTick) this.value.axisTick = {};
						this.value.axisTick.lineStyle = v;
					}
				}).interface,
				minor_split_line: new ve.Interface({
					show: new ve.Toggle(value.axisTick?.minorSplitLine, {
						name: "Show",
						onuserchange: (v) => {
							if (!this.value.axisTick) this.value.axisTick = {};
							if (!this.value.axisTick.minorSplitLine) this.value.axisTick.minorSplitLine = {};
							this.value.axisTick.minorSplitLine.show = v;
						}
					}),
					stroke_symbol: new ve.DatavisSuite.StrokeSymbol(value.axisTick?.minorSplitLine?.lineStyle, {
						name: "Stroke Symbol",
						onuserchange: (v) => {
							if (!this.value.axisTick) this.value.axisTick = {};
							if (!this.value.axisTick.minorSplitLine) this.value.axisTick.minorSplitLine = {};
							this.value.axisTick.minorSplitLine.lineStyle = v;
						}
					}).interface
				}, { name: "Minor Split Line" }),
				minor_tick: new ve.Interface({
					show: new ve.Toggle(value.axisTick?.minorTick, {
						name: "Show",
						onuserchange: (v) => {
							if (!this.value.axisTick) this.value.axisTick = {};
							if (!this.value.axisTick.minorTick) this.value.axisTick.minorTick = {};
							this.value.axisTick.minorTick.show = v;
						}
					}),
					
					length: new ve.Number(Math.returnSafeNumber(value.axisTick?.minorTick?.length, 3), {
						name: "Length",
						onuserchange: (v) => {
							if (!this.value.axisTick) this.value.axisTick = {};
							if (!this.value.axisTick.minorTick) this.value.axisTick.minorTick = {};
							this.value.axisTick.minorTick.length = v;
						}
					}),
					split_number: new ve.Number(Math.returnSafeNumber(value.axisTick?.minorTick?.splitNumber, 5), {
						name: "Length",
						onuserchange: (v) => {
							if (!this.value.axisTick) this.value.axisTick = {};
							if (!this.value.axisTick.minorTick) this.value.axisTick.minorTick = {};
							this.value.axisTick.minorTick.splitNumber = v;
						}
					}),
					stroke_symbol: new ve.DatavisSuite.StrokeSymbol(value.axisTick?.minorTick?.lineStyle, {
						name: "Stroke Symbol",
						onuserchange: (v) => {
							if (!this.value.axisTick) this.value.axisTick = {};
							if (!this.value.axisTick.minorTick) this.value.axisTick.minorTick = {};
							this.value.axisTick.minorTick.lineStyle = v;
						}
					}).interface
				}, { name: "Minor Split Line" })
			}, {
				name: "Axis Tick"
			}),
			break_area: new ve.Interface({
				show: new ve.Toggle(value?.breakArea?.show, {
					name: "Show",
					onuserchange: (v) => {
						if (!this.value.breakArea) this.value.breakArea = {};
						this.value.breakArea.show = v;
					}
				}),
				expand_on_click: new ve.Toggle(value?.breakArea?.expandOnClick, {
					name: "Expand On Click",
					onuserchange: (v) => {
						if (!this.value.breakArea) this.value.breakArea = {};
						this.value.breakArea.expandOnClick = v;
					}
				}),
				point_symbol: new ve.DatavisSuite.PointSymbol(value?.breakArea?.itemStyle, {
					name: "Point Symbol",
					onuserchange: (v) => {
						if (!this.value.breakArea) this.value.breakArea = {};
						this.value.breakArea.itemStyle = v;
					}
				}).interface,
				zigzag_amplitude: new ve.Number(Math.returnSafeNumber(value?.breakArea?.zigzagAmplitude, 4), {
					name: "Zigzag Amplitude",
					onuserchange: (v) => {
						if (!this.value.breakArea) this.value.breakArea = {};
						this.value.breakArea.zigzagAmplitude = v;
					}
				}),
				zigzag_max_span: new ve.Number(Math.returnSafeNumber(value?.breakArea?.zigzagMaxSpan, 4), {
					name: "Zigzag Max Span",
					onuserchange: (v) => {
						if (!this.value.breakArea) this.value.breakArea = {};
						this.value.breakArea.zigzagMaxSpan = v;
					}
				}),
				zigzag_min_span: new ve.Number(Math.returnSafeNumber(value?.breakArea?.zigzagMinSpan, 4), {
					name: "Zigzag Min Span",
					onuserchange: (v) => {
						if (!this.value.breakArea) this.value.breakArea = {};
						this.value.breakArea.zigzagMinSpan = v;
					}
				}),
				zigzag_z_index: new ve.Number(Math.returnSafeNumber(value?.breakArea?.zigzagZIndex, 100), {
					name: "Zigzag Z-Index",
					onuserchange: (v) => {
						if (!this.value.breakArea) this.value.breakArea = {};
						this.value.breakArea.zigzagZ = v;
					}
				})
			}, { name: "Break Area" }),
			breaks: new ve.Interface({
				break_editor: new ve.List([], {
					placeholder: new ve.ObjectEditor({
						gap: 0,
						end: 0,
						is_expanded: false,
						start: 0
					}),
					options: {
						do_not_allow_type_change: false,
						preserve_structure: true
					},
					onuserchange: (v) => {
						if (v.length === 0) {
							delete this.value.breaks;
						} else {
							//Iterate over all v components, set all_breaks
							let all_breaks = [];
							
							for (let i = 0; i < v.length; i++)
								all_breaks.push(v[i].v);
							this.value.breaks = all_breaks;
						}
					}
				})
			}, { name: "Breaks" }),
			name_truncate: new ve.Interface({
				ellipsis: new ve.Text((value?.nameTruncate?.ellipsis) ? value?.nameTruncate?.ellipsis : "...", {
					name: "Ellipsis",
					onuserchange: (v) => {
						if (!this.value.nameTruncate) this.value.nameTruncate = {};
						this.value.nameTruncate.ellipsis = v;
					}
				}),
				max_width: new ve.Number(Math.returnSafeNumber(value?.nameTruncate?.maxWidth, -1), {
					name: "Max Width",
					onuserchange: (v) => {
						if (!this.value.nameTruncate) this.value.nameTruncate = {};
						this.value.nameTruncate.maxWidth = (v > 0) ? v : undefined;
					}
				})
			}, {
				name: "Name Truncate"
			}),
			overlap: new ve.Interface({
				move_overlap: new ve.Select({
					auto: { name: "Auto" },
					"true": { name: "True" },
					"false": { name: "False" }
				}, {
					name: "Move Overlap",
					onuserchange: (v) => {
						if (!this.value.breakLabelLayout) this.value.breakLabelLayout = {};
						if (v === "true") v = true;
						if (v === "false") v = false;
						this.value.breakLabelLayout.moveOverlap = v;
					}
				}),
			}, { name: "Overlap" }),
			split_area: new ve.Interface({
				show: new ve.Toggle(value?.splitArea?.show, {
					name: "Show",
					onuserchange: (v) => {
						if (!this.value.splitArea) this.value.splitArea = {};
						this.value.splitArea.show = v;
					}
				}),
				fill_symbol: new ve.DatavisSuite.FillSymbol(value?.splitArea?.areaStyle, {
					name: "Fill Symbol",
					onuserchange: (v) => {
						if (!this.value.splitArea) this.value.splitArea = {};
						this.value.splitArea.areaStyle = v;
					}
				}).interface,
				interval: new ve.Text((value.splitArea?.interval !== undefined) ? value.splitArea.interval : "auto", {
					name: "Interval",
					onuserchange: (v) => {
						if (!this.value.splitArea) this.value.splitArea = {};
						if (!isNaN(parseFloat(v))) v = parseFloat(v);
						this.value.splitArea.interval = v;
					}
				}),
			}, { name: "Split Area" }),
			split_line: new ve.Interface({
				show: new ve.Toggle(value?.splitLine?.show, {
					name: "Show",
					onuserchange: (v) => {
						if (!this.value.splitLine) this.value.splitLine = {};
						this.value.splitLine.show = v;
					}
				}),
				
				interval: new ve.Text((value.splitLine?.interval !== undefined) ? value.splitLine.interval : "auto", {
					name: "Interval",
					onuserchange: (v) => {
						if (!this.value.splitLine) this.value.splitLine = {};
						if (!isNaN(parseFloat(v))) v = parseFloat(v);
						this.value.splitLine.interval = v;
					}
				}),
				show_max_line: new ve.Toggle(value.splitLine?.interval, {
					name: "Show Max Line",
					onuserchange: (v) => {
						if (!this.value.splitLine) this.value.splitLine = {};
						this.value.splitLine.interval = v;
					}
				}),
				show_min_line: new ve.Toggle(value.splitLine?.interval, {
					name: "Show Min Line",
					onuserchange: (v) => {
						if (!this.value.splitLine) this.value.splitLine = {};
						this.value.splitLine.interval = v;
					}
				}),
				stroke_symbol: new ve.DatavisSuite.StrokeSymbol(value.splitLine?.lineStyle, {
					name: "Stroke Symbol",
					onuserchange: (v) => {
						if (!this.value.splitLine) this.value.splitLine = {};
						this.value.splitLine.strokeSymbol = v;
					}
				}).interface
			}, { name: "Split Line" }),
			
			advanced_styling: new ve.Interface({
				align_ticks: new ve.Toggle(value.alignTicks, {
					name: "Align Ticks",
					onuserchange: (v) => this.value.alignTicks = v
				}),
				boundary_gap: new ve.Toggle(value.boundaryGap, {
					name: "Boundary Gap",
					onuserchange: (v) => this.value.boundaryGap = v
				}),
				boundary_gap_array: new ve.RawInterface({
					boundary_gap_array_x: new ve.Text(value.boundaryGap?.[0]),
					boundary_gap_array_y: new ve.Text(value.boundaryGap?.[1])
				}, {
					name: "Boundary Gap X, Y",
					onuserchange: (v) => this.value.boundaryGap = [v.boundary_gap_array_x.v, v.boundary_gap_array_y.v]
				}),
				grid_index: new ve.Number(Math.returnSafeNumber(value.gridIndex), {
					name: "Grid Index",
					onuserchange: (v) => this.value.gridIndex = v
				}),
				interactive: new ve.Toggle(value.interactive, {
					name: "Interactive",
					onuserchange: (v) => this.value.interactive = v
				}),
				interval: new ve.Number(Math.returnSafeNumber(value.interval), {
					name: "Interval",
					onuserchange: (v) => this.value.interval = v
				}),
				inverse: new ve.Toggle(value.inverse, {
					name: "Inverse",
					onuserchange: (v) => this.value.inverse = v
				}),
				log_base: new ve.Number(Math.returnSafeNumber(value.logBase, 10), {
					name: "Log Base",
					onuserchange: (v) => this.value.logBase = v
				}),
				jitter: new ve.Toggle(value.jitter, {
					name: "Jitter",
					onuserchange: (v) => this.value.jitter = v,
					tooltip: "Applicable only to Scatterplot."
				}),
				jitter_margin: new ve.Number(Math.returnSafeNumber(value.jitterMargin, 2), {
					name: "Jitter Margin",
					onuserchange: (v) => this.value.jitterMargin = v,
					tooltip: "Applicable only to Scatterplot."
				}),
				jitter_overlap: new ve.Toggle(value.jitterOverlap, {
					name: "Jitter Overlap",
					onuserchange: (v) => this.value.jitterOverlap = v,
					tooltip: "Applicable only to Scatterplot."
				}),
				max: new ve.Text(value.max, {
					name: "Max",
					onuserchange: (v) => {
						if (!isNaN(parseFloat(v))) v = parseFloat(v);
						this.value.max = v;
					}
				}),
				max_interval: new ve.Number(Math.returnSafeNumber(value.maxInterval), {
					name: "Max Interval",
					onuserchange: (v) => this.value.maxInterval = v
				}),
				min: new ve.Text(value.min, {
					name: "Min",
					onuserchange: (v) => {
						if (!isNaN(parseFloat(v))) v = parseFloat(v);
						this.value.min = v;
					}
				}),
				min_interval: new ve.Number(Math.returnSafeNumber(value.minInterval), {
					name: "Min Interval",
					onuserchange: (v) => this.value.minInterval = v
				}),
				offset: new ve.Number(Math.returnSafeNumber(value.offset), {
					name: "Offset",
					onuserchange: (v) => this.value.offset = v
				}),
				scale: new ve.Toggle(value.scale, {
					name: "Scale",
					onuserchange: (v) => this.value.scale = v
				}),
				silent: new ve.Toggle(value.silent, {
					name: "Silent",
					onuserchange: (v) => this.value.silent = v
				}),
				split_number: new ve.Number(Math.returnSafeNumber(value.splitNumber, 5), {
					name: "Split Number",
					onuserchange: (v) => this.value.splitNumber = v
				}),
				start_value: new ve.Number(Math.returnSafeNumber(value.startValue, 0), {
					name: "Start Value",
					onuserchange: (v) => this.value.startValue = v
				}),
				text_symbol: new ve.DatavisSuite.TextSymbol(value.nameTextStyle, {
					name: "Text Symbol",
					onuserchange: (v) => this.value.nameTextStyle = v
				}).interface,
				z_index: new ve.Number(Math.returnSafeNumber(value.z), {
					name: "Z-Index",
					onuserchange: (v) => this.value.z = v
				}),
			}, { name: "Styling (Advanced)" }),
			tooltip: new ve.Interface({
				label_symbol: new ve.DatavisSuite.LabelSymbol(value?.tooltip?.textStyle, {
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
					selected: (this.value.animationEasing) ? this.value.animationEasing : "cubicOut",
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
					selected: (this.value.animationEasingUpdate) ? this.value.animationEasingUpdate : "cubicOut",
					onuserchange: (v) => this.value.animationEasingUpdate = v
				})
			}, { name: "Animation" }),
			position: position_obj
		}, { 
			name: (this.options.name) ? this.options.name : "Axis Symbol",
			onuserchange: () => {
				//Draw graph; fire to binding if possible
				delete this.do_not_fire_to_binding;
				this.fireToBinding();
			},
			style: this.options.style,
			x: this.options.x,
			y: this.options.y
		});
		this.interface.bind(this.element);
		this.value = value;
	}
	
	/**
	 * Gets the data series that determines axis tick labels from `arg1_options.datavis_suite_obj`.
	 * 
	 * @param {string} arg0_series_id
	 * @param {Object} [arg1_options]
	 *  @param {string} [arg1_options.mode="vertical"] - Either 'horizontal'/'vertical'.
	 */
	getDataSeries (arg0_series_id, arg1_options) {
		//Convert from parameters
		let series_id = arg0_series_id;
		let options = (arg1_options) ? arg1_options : {};
		
		//Declare local instance variables
		let datavis_suite_obj = this.options.datavis_suite_obj;
			if (!datavis_suite_obj) return; //Internal guard clause if datavis_suite_obj is undefined
		let series_data = datavis_suite_obj.getSeriesData(series_id);
		
		//Iterate over series_data in the direction of `arg1_options.mode`
		let all_axis_labels = [];
		
		if (options.mode === "horizontal") {
			let max_length = 0;
			
			for (let i = 0; i < series_data.length; i++)
				max_length = Math.max(max_length, series_data[i].length);
			for (let i = 0; i < max_length; i++)
				for (let x = 0; x < series_data.length; x++)
					if (series_data[x][i]) all_axis_labels.push(series_data[x][i]);
		} else {
			for (let i = 0; i < series_data.length; i++)
				for (let x = 0; x < series_data[i].length; x++)
					if (series_data[i][x]) all_axis_labels.push(series_data[i][x]);
		}
		
		//Return statement
		return all_axis_labels;
	}
};