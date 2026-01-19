/**
 * Internal sub-component of <span color = "yellow">{@link ve.DatavisSuite}</span>.
 *
 * Please refer to <span color = "yellow">{@link ve.Component}</span> for methods or fields inherited from this Component's parent such as `.options.attributes` or `.element`.
 *
 * ##### Constructor:
 * - `arg0_value`: {@link Object}
 * - `arg1_options`: {@link Object}
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
			name: new ve.Text((value.name) ? value.name : "", {
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
						this.value.nameTruncate.maxWidth = v;
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
			})
		});
	}
};