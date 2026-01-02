ve.DatavisSuite.PointSymbol = class extends ve.Component {
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-datavis-suite-point-symbol");
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
		
		//Declare local instance variables
		if (!value.decal) value.decal = {};
		if (!this.value.decal) this.value.decal = {};
		
		//Parse value
		this.element.innerHTML = "";
		this.interface = new ve.Interface({
			border_cap: new ve.Select({
				butt: { name: "Butt" },
				round: { name: "Round" },
				square: { name: "Square" }
			}, {
				name: "Border Cap",
				onuserchange: (v) => this.value.borderCap = v,
				selected: (value.borderCap) ? value.borderCap : "butt"
			}),
			border_colour: new ve.Colour((value.borderColor) ? value.borderColor : "#000000", {
				name: "Border Colour",
				onuserchange: (v) => this.value.borderColor = v
			}),
			border_dash_offset: new ve.Number(Math.returnSafeNumber(value.borderDashOffset), {
				name: "Border Dash Offset",
				onuserchange: (v) => this.value.borderDashOffset = v
			}),
			border_join: new ve.Select({
				bevel: { name: "Bevel" },
				miter: { name: "Miter" },
				round: { name: "Round" }
			}, {
				name: "Border Join",
				onuserchange: (v) => this.value.borderJoin = v,
				selected: (value.borderJoin) ? value.borderJoin : "bevel"
			}),
			border_miter_limit: new ve.Number(Math.returnSafeNumber(value.borderMiterLimit, 10), {
				name: "Border Miter Limit",
				onuserchange: (v) => this.value.borderMiterLimit = v
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
			border_width: new ve.Number(Math.returnSafeNumber(value.border_width), {
				name: "Border Width",
				onuserchange: (v) => this.value.borderWidth = v
			}),
			colour: new ve.Colour((value.color) ? value.color : "#ffffff", {
				name: "Colour",
				onuserchange: (v, e) => this.value.color = e.getHex()
			}),
			decal: new ve.Interface({
				background_colour: new ve.Colour((value.decal.backgroundColor) ? 
					value.decal.backgroundColor : "#000000", {
					name: "Background Colour",
					onuserchange: (v, e) => this.value.decal.backgroundColor = e.getHex()
				}),
				colour: new ve.Colour((value.decal.color) ? 
					value.decal.color : "#ffffff", {
					name: "Colour",
					onuserchange: (v, e) => this.value.decal.color = e.getHex()
				}),
				dash_array_x: new ve.Number(Math.returnSafeNumber(value.decal.dashArrayX, 5), {
					name: "Dash Array X",
					onuserchange: (v) => this.value.dashArrayX = v
				}),
				dash_array_y: new ve.Number(Math.returnSafeNumber(value.decal.dashArrayY, 5), {
					name: "Dash Array Y",
					onuserchange: (v) => this.value.dashArrayY = v
				}),
				max_tile_height: new ve.Number(Math.returnSafeNumber(value.decal.maxTileHeight, 512), {
					name: "Max Tile Height",
					onuserchange: (v) => this.value.maxTileHeight = v
				}),
				max_tile_width: new ve.Number(Math.returnSafeNumber(value.decal.maxTileWidth, 512), {
					name: "Max Tile Width",
					onuserchange: (v) => this.value.maxTileWidth = v
				}),
				rotation: new ve.Number(Math.returnSafeNumber(value.decal.rotation), {
					name: "Rotation",
					onuserchange: (v) => this.value.rotation = v
				}),
				symbol: new ve.Select({
					arrow: { name: "Arrow" },
					circle: { name: "Circle" },
					diamond: { name: "Diamond" },
					none: { name: "None" },
					pin: { name: "Pin" },
					triangle: { name: "Triangle" },
					rect: { name: "Rectangle" },
					roundRect: { name: "Rounded Rectangle" },
				}, {
					name: "Symbol",
					onuserchange: (v) => this.value.decal.symbol = v,
					selected: value.decal.symbol
				}),
				symbol_keep_aspect: new ve.Toggle((value.decal.symbolKeepAspect !== undefined) ? 
					value.decal.symbolKeepAspect : true, {
					name: "Symbol Keep Aspect",
					onuserchange: (v) => this.value.decal.symbolKeepAspect = v
				}),
				symbol_size: new ve.Number(Math.returnSafeNumber(value.decal.symbolSize, 1), {
					name: "Symbol Size",
					onuserchange: (v) => this.value.decal.symbolSize = v
				})
			}, { name: "Decal" }),
			opacity: new ve.Range(Math.returnSafeNumber(value.opacity, 1), {
				name: "Opacity",
				onuserchange: (v) => this.value.opacity = v
			}),
			shadow_blur: new ve.Number(Math.returnSafeNumber(value.shadowBlur), {
				name: "Shadow Blur",
				onuserchange: (v) => this.value.shadowBlur = v
			}),
			shadow_colour: new ve.Colour((value.shadowColor) ? value.shadowColor : "#000000", {
				name: "Shadow Colour",
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
		}, {
			name: (this.options.name) ? this.options.name : "Point Symbol"
		});
		this.interface.bind(this.element);
		this.value = value;
	}
};

//Functional binding

/**
 * @returns {ve.DatavisSuite.PointSymbol}
 */
veDatavisSuitePointSymbol = function () {
	//Return statement
	return new ve.DatavisSuite.PointSymbol(...arguments);
};