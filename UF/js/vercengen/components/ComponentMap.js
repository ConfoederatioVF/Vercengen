ve.Map = class veMap extends ve.Component {
	static instances = [];
	
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = arg0_value;
		let options = (arg1_options) ? arg1_options : {
			center: [51.505, -0.09],
			zoom: 5,
			/*spatialReference: {
				projection: 'EPSG:3857' // Ensure that both Maptalks and Leaflet use the same projection
			},*/
			baseLayer: new maptalks.TileLayer("base", {
				spatialReference: {
					projection:'EPSG:3857'
				},
				urlTemplate: /*"https://tile.tracestrack.com/en/{z}/{x}/{y}.webp?key=28ea24747e9fda45b57a2b0b9338f488", */"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
				subdomains: ["a", "b", "c"],
				repeatWorld: false
			}),
			...arg1_options
		};
			super(options);
			
		//Declare local instance variables
		this.id = Class.generateRandomID(ve.Map);
		
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-map");
			this.element.id = this.id;
			this.element.instance = this;
			HTML.setAttributesObject(this.element, options.attributes);
			HTML.applyCSSStyle(this.element, options.style);
		this.map = undefined;
		
		//Set this.v
		this.v = options;
	}
	
	loadDate () {
		
	}
	
	get v () {
		//Return statement
		return this.map;
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
		
		//Declare local instance variables
		this.map = new maptalks.Map(this.element, value);
	}
}