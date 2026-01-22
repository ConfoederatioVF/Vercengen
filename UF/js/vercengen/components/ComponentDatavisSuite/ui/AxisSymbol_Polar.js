ve.DatavisSuite.AxisSymbol_Polar = class extends ve.Component {
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		let options = (arg1_options) ? arg1_options : {};
		super(options);
		
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		
		//Declare local instance variables
		this.element = document.createElement("div");
		this.element.setAttribute("component", "ve-datavis-suite-axis-symbol-polar");
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
			id: new ve.Text(value.id, {
				name: "ID",
				onuserchange: (v) => this.value.id = v
			}),
			
			centre: new ve.Text(["50%", "50%"], {
				name: "Centre",
				onuserchange: (v) => this.value.center = v
			}),
			coordinate_system: new ve.Select({
				calendar: { name: "Calendar" },
				matrix: { name: "Matrix" },
				none: { name: "None" }
			}, {
				name: "Coordinate System",
				selected: (value.coordinateSystem) ? value.coordinateSystem : "none",
				onuserchange: (v) => this.value.coordinateSystem = v
			}),
			radius: new ve.Text((value.radius) ? value.radius : ["", ""], {
				name: "Radius",
				max: 2,
				min: 2,
				onuserchange: (v) => this.value.radius = [
					(!isNaN(parseFloat(v[0]))) ? parseFloat(v[0]) : v[0],
					(!isNaN(parseFloat(v[1]))) ? parseFloat(v[1]) : v[1]
				]
			}),
			z_index: new ve.Number(Math.returnSafeNumber(value.z, 2), {
				name: "Z Index",
				onuserchange: (v) => this.value.z = v
			}),
			
			calendar_id: new ve.Number(Math.returnSafeNumber(value.calendarId), {
				name: "Calendar ID",
				onuserchange: (v) => this.value.calendarId = v
			}),
			calendar_index: new ve.Number(Math.returnSafeNumber(value.calendarIndex), {
				name: "Calendar Index",
				onuserchange: (v) => this.value.calendarIndex = v
			}),
			matrix_id: new ve.Number(Math.returnSafeNumber(value.matrixId), {
				name: "Matrix IO",
				onuserchange: (v) => this.value.matrixId = v
			}),
			matrix_index: new ve.Number(Math.returnSafeNumber(value.matrixIndex), {
				name: "Matrix Index",
				onuserchange: (v) => this.value.matrixIndex = v
			}),
			
			tooltip: new ve.Interface({
				label_symbol: new ve.DatavisSuite.LabelSymbol(value.tooltip?.textStyle, {
					name: "Label Symbol",
					onuserchange: (v) => {
						if (!this.value.tooltip) this.value.tooltip = {};
						this.value.tooltip.textStyle = v;
					}
				}).interface,
				tooltip_symbol: new ve.DatavisSuite.TooltipSymbol(value.tooltip, {
					name: "Tooltip",
					onuserchange: (v) => {
						if (!this.value.tooltip) this.value.tooltip = {};
						this.value.tooltip = {
							...this.value.tooltip,
							...v
						};
					}
				}).interface
			}, { name: "Tooltip" })
		}, {
			name: (this.options.name) ? this.options.name : "Axis Symbol (Polar)",
			onuserchange: () => {
				//Draw graph; fire to binding if possible
				if (this.options.graph_obj) {
					this.options.graph_obj.options.symbol.polar = this.value;
					this.options.graph_obj.draw();
				}
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
};

//Functional binding

/**
 * @returns {ve.DatavisSuite.AxisSymbol_Polar}
 */
veDatavisSuiteAxisSymbol_Polar = function () {
	//Return statement
	return new ve.DatavisSuite.AxisSymbol_Polar(...arguments);
};