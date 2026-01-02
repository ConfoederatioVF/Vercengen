ve.DatavisSuite.StrokeSymbol = class extends ve.Component {
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Initialise options
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-datavis-suite-stroke-symbol");
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
			stroke_colour: new ve.Colour((value.color) ? value.color : "#000000", {
				name: "Stroke Colour",
				onuserchange: (v, e) => {
					this.value.borderColor = e.getHex();
					this.value.color = e.getHex();
				}
			}),
			stroke_opacity: new ve.Range(Math.returnSafeNumber(value.opacity, 1), {
				name: "Stroke Opacity",
				onuserchange: (v) => this.value.opacity = v
			}),
			stroke_pattern: new ve.Select({
				dashed: { name: "Dashed" },
				dotted: { name: "Dotted" },
				solid: { name: "Solid" }
			}, {
				name: "Stroke Pattern",
				onuserchange: (v) => {
					this.value.borderType = v;
					this.value.type = v;
				},
				selected: (value.type) ? value.type : "solid"
			}),
			stroke_width: new ve.Number(Math.returnSafeNumber(value.strokeWidth, 2), {
				name: "Stroke Width",
				onuserchange: (v) => {
					this.value.borderWidth = v;
					this.value.width = v;
				}
			}),
			
			stroke_style: new ve.Interface({
				stroke_cap: new ve.Select({
					butt: { name: "Butt" },
					round: { name: "Round" },
					square: { name: "Square" }
				}, {
					name: "Stroke Cap",
					onuserchange: (v) => {
						this.value.borderCap = v;
						this.value.cap = v;
					},
					selected: (value.cap) ? value.cap : "butt"
				}),
				stroke_dash_offset: new ve.Number(Math.returnSafeNumber(value.strokeDashOffset), {
					name: "Stroke Dash Offset",
					onuserchange: (v) => {
						this.value.borderDashOffset = v;
						this.value.dashOffset = v;
					}
				}),
				stroke_join: new ve.Select({
					bevel: { name: "Bevel" },
					miter: { name: "Miter" },
					round: { name: "Round" }
				}, {
					name: "Stroke Join",
					onuserchange: (v) => {
						this.value.borderJoin = v;
						this.value.join = v;
					},
					selected: (value.join) ? value.join : "bevel"
				}),
				stroke_miter_limit: new ve.Number(Math.returnSafeNumber(value.miterLimit, 10), {
					name: "Stroke Miter Limit",
					onuserchange: (v) => {
						this.value.borderMiterLimit = v;
						this.value.miterLimit = v;
					}
				})
			}, { name: "Stroke Style" }),
			
			stroke_shadow: new ve.Interface({
				shadow_blur: new ve.Number(Math.returnSafeNumber(value.shadowBlur), {
					name: "Shadow Blur",
					onuserchange: (v) => this.value.shadowBlur = v
				}),
				shadow_offset_x: new ve.Number(Math.returnSafeNumber(value.shadowOffsetX), {
					name: "Shadow Offset X",
					onuserchange: (v) => this.value.shadowOffsetX = v
				}),
				shadow_offset_y: new ve.Number(Math.returnSafeNumber(value.shadowOffsetY), {
					name: "Shadow Offset Y",
					onuserchange: (v) => this.value.shadowOffsetY = v
				})
			}, { name: "Stroke Shadow" })
		}, {
			name: (this.options.name) ? this.options.name : "Stroke Symbol"
		});
		this.interface.bind(this.element);
		this.value = value;
	}
};

//Functional binding

/**
 * @returns {ve.DatavisSuite.StrokeSymbol}
 */
veDatavisSuiteStrokeSymbol = function () {
	//Return statement
	return new ve.DatavisSuite.StrokeSymbol(...arguments);
};