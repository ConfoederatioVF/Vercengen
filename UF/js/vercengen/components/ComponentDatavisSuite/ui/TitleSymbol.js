ve.DatavisSuite.TitleSymbol = class extends ve.Component {
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
			
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-datavis-suite-title-symbol");
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
			show: new ve.Toggle(value.show, {
				name: "Show",
				onuserchange: (v) => this.value.show = v
			}),
			
			_name: new ve.Text(value.text, {
				name: "Name",
				onuserchange: (v) => this.value.text = v
			}),
			link: new ve.URL(value.link, {
				name: "Link",
				onuserchange: (v) => this.value.link = v
			}),
			target: new ve.Select({
				blank: { name: "Blank" },
				self: { name: "Self" }
			}, {
				name: "Target",
				selected: (value.target) ? value.target : "blank",
				onuserchange: (v) => this.value.target = v
			}),
			title_symbol: new ve.DatavisSuite.TextSymbol(value.textStyle, {
				name: "Title Symbol",
				onuserchange: (v) => this.value.textStyle = v
			}),
			
			coordinates: new ve.Interface({
				coord: new ve.RawInterface({
					coord_x: new ve.Text((value.coord?.[0] !== undefined) ? value.coord[0] : 0, { name: "X" }),
					coord_y: new ve.Text((value.coord?.[1] !== undefined) ? value.coord[1] : 0, { name: "Y" })
				}, {
					onuserchange: (v) => {
						if (!isNaN(parseFloat(v.coord_x.v))) v.coord_x.v = parseFloat(v.coord_x.v);
						if (!isNaN(parseFloat(v.coord_y.v))) v.coord_y.v = parseFloat(v.coord_y.v);
						
						this.value.coord = [v.coord_x.v, v.coord_y.v];
					}
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
				coordinate_system_usage: new ve.Select({
					box: { name: "Box" },
					data: { name: "Data" }
				}, {
					name: "Coordinate System Usage",
					selected: (value.coordinateSystemUsage) ? value.coordinateSystemUsage : "box",
					onuserchange: (v) => this.value.coordinateSystemUsage = v
				})
			}, { name: "Coordinates" }),
			position: new ve.Interface({
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
			}, { name: "Position" }),
			styling: new ve.Interface({
				background_colour: new ve.Colour((value.backgroundColor) ? value.backgroundColor : [0, 0, 0, 0], {
					name: "Background Colour",
					is_rgba: true,
					onuserchange: (v, e) => this.value.backgroundColor = e.getHex()
				}),
				border_colour: new ve.Colour((value.borderColor) ? value.borderColor : "#cccccc", {
					name: "Border Colour",
					onuserchange: (v, e) => this.value.borderColor = e.getHex()
				}),
				border_radius: new ve.Number((value.borderRadius) ? value.borderRadius : [0, 0, 0, 0], {
					name: "Border Radius",
					onuserchange: (v) => this.value.borderRadius = v
				}),
				border_width: new ve.Number(Math.returnSafeNumber(value.borderWidth, 1), {
					name: "Border Width",
					onuserchange: (v) => this.value.borderWidth = v
				}),
				shadow_blur: new ve.Number(Math.returnSafeNumber(value.shadowBlur), {
					name: "Shadow Blur",
					onuserchange: (v) => this.value.shadowBlur = v
				}),
				shadow_colour: new ve.Colour((value.shadowColor) ? value.shadowColor : [0, 0, 0, 0], {
					name: "Shadow Colour",
					is_rgba: true,
					onuserchange: (v, e) => this.value.shadowColor = e.getHex()
				}),
				shadow_offset_x: new ve.Number(Math.returnSafeNumber(value.shadowOffsetX), {
					name: "Shadow Offset X",
					onuserchange: (v) => this.value.shadowOffsetX = v
				}),
				shadow_offset_y: new ve.Number(Math.returnSafeNumber(value.shadowOffsetY), {
					name: "Shadow Offset Y",
					onuserchange: (v) => this.value.shadowOffsetY = v
				})
			}, { name: "Styling" }),
			advanced_styling: new ve.Interface({
				calendar_id: new ve.Number(Math.returnSafeNumber(value.calendarId), {
					name: "Calendar ID",
					onuserchange: (v) => this.value.calendarId = v
				}),
				calendar_index: new ve.Number(Math.returnSafeNumber(value.calendarIndex), {
					name: "Calendar Index",
					onuserchange: (v) => this.value.calendarIndex = v
				}),
				item_gap: new ve.Number(Math.returnSafeNumber(value.itemGap, 10), {
					name: "Item Gap",
					onuserchange: (v) => this.value.itemGap = v
				}),
				matrix_id: new ve.Number(Math.returnSafeNumber(value.matrixId), {
					name: "Matrix IO",
					onuserchange: (v) => this.value.matrixId = v
				}),
				matrix_index: new ve.Number(Math.returnSafeNumber(value.matrixIndex), {
					name: "Matrix Index",
					onuserchange: (v) => this.value.matrixIndex = v
				}),
				padding: new ve.Number((value.padding) ? value.padding : [5], {
					name: "Padding",
					onuserchange: (v) => {
						if (v.length === 1) {
							this.value.padding = v[0];
							return;
						}
						this.value.padding = v;
					}
				}),
				text_align: new ve.Select({
					auto: { name: "Auto" },
					center: { name: "Centre" },
					left: { name: "Left" },
					right: { name: "Right" }
				}, {
					name: "Text Align",
					onuserchange: (v) => this.value.textAlign = v,
					selected: (value.textAlign) ? value.textAlign : "auto"
				}),
				text_vertical_align: new ve.Select({
					auto: { name: "Auto" },
					bottom: { name: "Bottom" },
					middle: { name: "Middle" },
					top: { name: "Top" }
				}, {
					name: "Text Vertical Align",
					onuserchange: (v) => this.value.textVerticalAlign = v,
					selected: (value.textVerticalAlign) ? value.textVerticalAlign : "auto"
				}),
				trigger_event: new ve.Toggle(value.triggerEvent, {
					name: "Trigger Event",
					onuserchange: (v) => this.value.triggerEvent = v
				}),
				z_index: new ve.Number(Math.returnSafeNumber(value.z, 2), {
					name: "Z Index",
					onuserchange: (v) => this.value.z = v
				}),
				z_level: new ve.Number(Math.returnSafeNumber(value.zlevel), {
					name: "Z Level",
					onuserchange: (v) => this.value.zlevel = v
				})
			}, { name: "Styling (Advanced)" }),
			subtitle: new ve.Interface({
				subtitle: new ve.Text(value.subtitle, {
					name: "Subtitle",
					onuserchange: (v) => this.value.subtitle = v
				}),
				sublink: new ve.URL(value.sublink, {
					name: "Sublink",
					onuserchange: (v) => this.value.sublink = v
				}),
				subtarget: new ve.Select({
					blank: { name: "Blank" },
					self: { name: "Self" }
				}, {
					name: "Subtarget",
					selected: (value.subtarget) ? value.subtarget : "blank",
					onuserchange: (v) => this.value.subtarget = v
				}),
				subtitle_symbol: new ve.DatavisSuite.TextSymbol(value.subtextStyle, {
					name: "Subtitle Symbol",
					onuserchange: (v) => this.value.subtextStyle = v
				}),
			}, { name: "Subtitle Symbol" }),
		}, { 
			name: (this.options.name) ? this.options.name : "Title Symbol",
			onuserchange: () => {
				delete this.do_not_fire_to_binding;
				this.fireToBinding();
			}
		});
		this.interface.bind(this.element);
		this.value = value;
	}
};

//Functional binding

/**
 * @returns {ve.DatavisSuite.TitleSymbol}
 */
veDatavisSuiteTitleSymbol = function () {
	//Return statement
	return new ve.DatavisSuite.TitleSymbol(...arguments);
};