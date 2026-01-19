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
 *   - `.name="X Axis Symbol"`: {@link string}
 */
ve.DatavisSuite.XAxisSymbol = class extends ve.Component {
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
				onuserchange: (v) => this.value.data = v
			}),
			...data_series,
			
			axis_label: new ve.Interface({
				
			}, {
				name: "Axis Label"
			})
		}, { 
			name: (this.options.name) ? this.options.name : "X Axis Symbol",
			onuserchange: (v, e) => {
				//Draw graph; fire to binding if possible
				if (this.options.graph_obj) {
					this.options.graph_obj.options.xAxis.symbol = this.value;
					this.options.graph_obj.draw();
				}
				delete this.do_not_fire_to_binding;
				this.fireToBinding();
			}
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