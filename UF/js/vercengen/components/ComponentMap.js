/**
 * Refer to <span color = "yellow">{@link ve.Component}</span> for methods or fields inherited from this Component's parent such as `.options.attributes` or `.element`.
 * 
 * Creates a Maptalks {@link maptalks.Map} that can be used for mounting and displaying geometries and tilelayers to.
 * - Functional binding: <span color=00ffff>veMap</span>().
 * 
 * ##### Constructor:
 * - `arg0_value`: {@link Object} - The {@link maptalks.Map} `.options` that determines the projection and base layer.
 * - `arg1_options`: {@link Object}
 * 
 * ##### Instance:
 * - `.map`: {@link maptalks.Map}
 * - `.v`: {@link maptalks.Map}
 * 
 * @augments ve.Component
 * @augments {@link ve.Component}
 * @memberof ve.Component
 * @type {ve.Map}
 */
ve.Map = class extends ve.Component {
	static instances = [];
	
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = {
			center: [51.505, -0.09],
			zoom: 5,
			/*spatialReference: {
				projection: 'EPSG:3857' // Ensure that both Maptalks and Leaflet use the same projection
			},*/
			baseLayer: new maptalks.TileLayer("base", {
				spatialReference: {
					projection:'EPSG:3857'
				},
				urlTemplate: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
				subdomains: ["a", "b", "c"],
				repeatWorld: false
			}),
			...arg0_value
		};
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Declare local instance variables
		this.id = Class.generateRandomID(ve.Map);
		
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-map");
		this.element.id = this.id;
		this.element.instance = this;
		HTML.setAttributesObject(this.element, options.attributes);
		HTML.applyTelestyle(this.element, options.style);
		this.options = options;
		this.map = undefined;
		
		//Set this.v
		this.v = value;
	}
	
	/**
	 * Returns the current mounted map.
	 * - Accessor of: {@link ve.Map}
	 * 
	 * @returns {ve.Map}
	 */
	get v () {
		//Return statement
		return this.map;
	}
	
	/**
	 * Redraws and sets a new map with the same options as determined by `arg0_value`.
	 * - Accessor of: {@link ve.Map}
	 * 
	 * @param {Object} arg0_value
	 */
	set v (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
		
		//Declare local instance variables
		this.map = new maptalks.Map(this.element, value);
	}
}

//Functional binding

/**
 * @returns {ve.Map}
 */
veMap = function () {
	//Return statement
	return new ve.Map(...arguments);
};