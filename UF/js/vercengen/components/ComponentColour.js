/**
 * Refer to <span color = "yellow">{@link ve.Component}</span> for methods or fields inherited from this Component's parent such as `.options.attributes` or `.element`.
 *
 * Basic colour input used to fetch [R, G, B] parameters. May also fetch hex value via <span color = 00ffff>getHex</span>().
 * - Functional binding: <span color=00ffff>veColour</span>().
 *
 * ##### Constructor:
 * - `arg0_value`: {@link Array}<{@link number}, {@link number}, {@link number}>
 * - `arg1_options`: {@link Object}
 *   - `.is_rgba=false`: {@link boolean} - If true, adds an opacity slider and handles [R, G, B, A] values.
 *
 * ##### Instance:
 * - `.v`: {@link Array}<{@link number}, {@link number}, {@link number}> - The R, G, B (and optional A) value of the present Component.
 *
 * ##### Methods:
 * - <span color=00ffff>{@link ve.Colour.getHex|getHex}</span>() | {@link string} - Returns the hex value of the present R, G, B value.
 * - <span color=00ffff>{@link ve.Colour.toString|toString}</span>() | {@link string} - Returns the R,G,B value as a string.
 *
 * @augments ve.Component
 * @memberof ve.Component
 * @type {ve.Colour}
 */
ve.Colour = class extends ve.Component {
	static demo_value =  [220, 160, 60];
	
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let options = (arg1_options) ? arg1_options : {};
		let initial_val = (arg0_value) ? arg0_value : [255, 255, 255];
		
		//Handle initial value separation (RGB vs A)
		let rgb_value = initial_val;
		let alpha_value = 100;
		
		if (Array.isArray(initial_val) && initial_val.length === 4) {
			alpha_value = initial_val[3];
			rgb_value = [initial_val[0], initial_val[1], initial_val[2]];
		} else if (typeof initial_val === "string" && initial_val.startsWith("#") && initial_val.length === 9) {
			// Handle 8-digit hex (#RRGGBBAA)
			let rgba = Colour.convertHexToRGBA(initial_val);
			alpha_value = rgba[3];
			rgb_value = [rgba[0], rgba[1], rgba[2]];
		}
		
		// Convert RGB part to hex for the HTML input
		let value = Colour.convertRGBToHex(rgb_value);
		
		super(options);
		
		//Initialise options
		options.attributes = options.attributes ? options.attributes : {};
		if (options.name === undefined) options.name = "Colour";
		
		//Declare local instance variables
		this.element = document.createElement("div");
		this.element.setAttribute("component", "ve-colour");
		this.element.instance = this;
		
		this.alpha = alpha_value;
		this.options = options;
		this.value = value;
		
		//Format HTML string
		let html_string = [];
		html_string.push(`<span id = "name"></span> `);
		html_string.push(`<input type = "color"${HTML.objectToAttributes(options.attributes)}>`);
		
		//Populate element and initialise handlers; set .instance
		this.element.innerHTML = html_string.join("");
		
		let input_el = this.element.querySelector("input");
		input_el.value = this.value; // Ensure input has initial value
		
		input_el.addEventListener("input", (e) => {
			this.value = e.target.value;
			this.fireToBinding();
		});
		
		//RGBA Opacity Slider Logic
		if (this.options.is_rgba) {
			this.opacity_slider = new ve.Range(this.alpha, {
				name: "OPA:",
				min: 0,
				max: 100,
				step: 1,
				style: {
					display: "inline"
				},
				
				onuserchange: (v) => {
					this.alpha = v/100;
					this.fireToBinding();
					this.element.querySelector(`input[type="color"]`).style.opacity = this.alpha;
				},
			});
			
			// Style tweaks to make it fit visually if needed, or just append
			this.element.appendChild(this.opacity_slider.element);
		}
		
		this.name = options.name;
		this.v = (this.options.is_rgba) ? [...rgb_value, alpha_value] : rgb_value;
	}
	
	/**
	 * Returns the current [R, G, B] (or [R, G, B, A]) value.
	 * - Accessor of: {@link ve.Colour}
	 *
	 * @alias v
	 * @memberof ve.Component.ve.Colour
	 * @type {number[]}
	 */
	get v () {
		//Get RGB from the hex input
		let rgb = Colour.convertHexToRGB(this.value);
		
		if (this.options.is_rgba) {
			return [rgb[0], rgb[1], rgb[2], this.alpha];
		}
		
		//Return statement
		return rgb;
	}
	
	/**
	 * Sets the current value (although HTML components internally store colour values as hex).
	 * Accepts [R, G, B], [R, G, B, A] or Hex string.
	 * - Accessor of: {@link ve.Colour}
	 *
	 * @alias v
	 * @memberof ve.Component.ve.Colour
	 *
	 * @param {number[]|string} arg0_value
	 */
	set v (arg0_value) {
		let input_rgb = arg0_value;
		let input_alpha = 1;
		
		//Normalise input to RGBA array
		if (typeof arg0_value === "string") {
			if (arg0_value.length > 7) { // 8-digit hex
				let rgba = Colour.convertHexToRGBA(arg0_value);
				input_rgb = [rgba[0], rgba[1], rgba[2]];
				input_alpha = rgba[3];
			} else {
				input_rgb = Colour.convertHexToRGB(arg0_value);
			}
		} else if (Array.isArray(arg0_value) && arg0_value.length === 4) {
			input_rgb = [arg0_value[0], arg0_value[1], arg0_value[2]];
			input_alpha = arg0_value[3];
		}
		
		//Convert RGB part to Hex for the standard HTML input
		let value = Colour.convertRGBToHex(input_rgb);
		
		//Set value and update UI
		this.value = value;
		this.element.querySelector("input").value = this.value;
		
		//Handle Alpha UI if enabled
		if (this.options.is_rgba) {
			this.alpha = input_alpha;
			if (this.opacity_slider) {
				// We set .v directly on the child component
				this.opacity_slider.v = this.alpha;
			}
		}
		
		this.fireFromBinding();
	}
	
	/**
	 * Returns the hexadecimal value of {@link ve.Colour} as a string.
	 * Returns 8-digit hex if is_rgba is true.
	 * - Method of: {@link ve.Colour}
	 *
	 * @alias getHex
	 * @memberof ve.Component.ve.Colour
	 *
	 * @returns {string}
	 */
	getHex () {
		if (this.options.is_rgba) {
			return Colour.convertRGBAToHex(this.v);
		}
		return Colour.convertRGBToHex(this.value);
	}
	
	/**
	 * Returns the 'R,G,B' (or 'R,G,B,A') value of {@link ve.Colour} as a string.
	 * - Method of: {@link ve.Colour}
	 *
	 * @alias toString
	 * @memberof ve.Component.ve.Colour
	 *
	 * @returns {string}
	 */
	toString () {
		return this.v.join(",");
	}
};