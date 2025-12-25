/**
 * Refer to <span color = "yellow">{@link ve.Component}</span> for methods or fields inherited from this Component's parent such as `.options.attributes` or `.element`.
 * 
 * ##### Constructor:
 * - `arg0_value`: {@link Object}
 *   - `.series`: {@link Object}
 *     - `.name`: {@link string}
 *     - `.origin`: {@link Array}<{@link number}, {@link number}, {@link number}> - The sheet index, X, Y origin of the top-left corner of `.value`, the first top-left populated cell.
 *     - `.pivot="column"`: {@link string} - Either 'column'/'row'.
 *     - `.symbol`: {@link Object} - The symbol the data line takes on.
 *     - `.labels`: {@link Array}<{@link string}> - The labels for each datapoint.
 *     - `.value`: {@link Array}<{@link Array}<{@link number}>> - 2D dataframe storing values within this series.
 * - `arg1_options`: {@link Object}
 *   - `.symbol`: {@link Object}
 *     - `.title`: {@link Object}
 *       - `.text`: {@link string}
 *   - `.type="line_chart"`: {@link string} - The type of chart to show in the graph.
 *   - 
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
	
	draw () { //[WIP] - Finish function body
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
		
		//Draw chart
		this.chart = echarts.init(this.element);
		this.chart_options = {};
		
		if (this.options.type === "line_chart") {
			this.chart_options.series = [];
			this.chart_options.title = {
				text: (this.options?.title?.text) ? this.options.title.text : ""
			};
			this.chart_options.xAxis = {
				boundaryGap: false,
				type: "category"
			};
			this.chart_options.yAxis = {
				type: "value"
			};
			
			Object.iterate(this.series, (local_key, local_value) => {
				let local_data = local_value.value;
				
				if (local_data.length > 1 && local_data[0].length >= 1) //Make sure selection is at least 1x1
					for (let i = 0; i < local_data[0].length; i++) {
						let local_column_data = [];
						
						//Iterate over all local_data rows in the current column
						for (let x = 1; x < local_data.length; x++)
							local_column_data.push(local_data[i][x]);
						
						//Create new this.chart_options.series
						this.chart_options.series.push({
							name: (local_data[i][0]) ? local_data[i][0] : local_key,
							data: local_column_data,
							type: "line",
							
							areaStyle: {
								color: "transparent"
							},
							emphasis: { focus: "series" },
							stack: local_key
						});
					}
			});
			
			this.chart.setOption(this.chart_options);
		}
	}
	
	get v () {
		//Return statement
		return this.value;
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		
		//Initialise value
		this.value = value;
		
		if (!this.value.series) this.value.series = {};
		if (!this.value.type) this.value.type = "line_chart";
		this.draw();
	}
	
	addSeries (arg0_series_obj, arg1_options) { //[WIP] - Finish function body
		//Convert from parameters
		let series_obj = arg0_series_obj;
		let options = (arg1_options) ? arg1_options : {};
		
		if (series_obj === undefined) return; //Internal guard clause if series_obj is undefined
		if (series_obj.coords === undefined) return; //Internal guard clause if series_obj.coords is undefined
		
		//Declare local instance variables
		let series_key = (options.key) ? 
			options.key : Object.generateRandomID(this.value.series);
		let return_obj = {};
		
		if (options.table_obj) {
			let series_values = options.table_obj.getRangeValue(series_obj.coords, { 
				return_raw_values: true 
			});
			
			if (!series_obj.pivot || series_obj.pivot === "column") {
				return_obj.labels = [];
				
				//Iterate over all series_values to fetch needed labels
				for (let i = 0; i < series_values.length; i++) {
					return_obj.push(series_values[i][0]);
					series_values[i].splice(0, 1);
				}
			} else {
				return_obj.labels = [];
				
				//Iterate over all series_values in the header to fetch needed labels
				for (let i = 0; i < series_values[0].length; i++)
					return_obj.push(series_values[0][i]);
				series_values.splice(0, 1);
			}
			
			return_obj.origin = series_obj.coords[0];
			return_obj.value = series_values;
		} else { //[WIP] - Implement this .pivot mode later
			
		}
		
		//Set new series and draw
		this.value.series[series_key] = return_obj;
		this.draw();
		
		//Return statement
		return this.value.series[series_key];
	}
};