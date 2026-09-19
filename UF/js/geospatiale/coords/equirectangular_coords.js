//Initialise functions
{
	if (!global.Geospatiale) global.Geospatiale = {};
	
	/**
	 * Checks the nearest equirectangular pixel from a raster image that fulfills a boolean condition.
	 *
	 * @param {number} arg0_lng
	 * @param {number} arg1_lat
	 * @param {Object} [arg2_options]
	 *  @param {Object} [arg2_options.input_raster]
	 *  @param {function} [arg2_options.special_function](arg0_raster:{@link Object}, arg1_x:number, arg2_y:number) | boolean - Returns true if condition is met.
	 */
	Geospatiale.getEquirectangularNearestPixelWith = function (arg0_lng, arg1_lat, arg2_options) {
		let lng = parseFloat(arg0_lng);
		let lat = parseFloat(arg1_lat);
		let options = arg2_options || {};
		let input_raster = options.input_raster;
		let special_function = options.special_function;
		
		let pixel_coords = Geospatiale.getEquirectangularCoordsPixel(lng, lat, {
			height: input_raster.height,
			width: input_raster.width
		});
		
		if (special_function(options.input_raster, pixel_coords[0], pixel_coords[1]))
			return pixel_coords; //Internal guard clause if the direct pixel matches the condition
		
		let width = input_raster.width;
		let height = input_raster.height;
		let start_x = pixel_coords[0];
		let start_y = pixel_coords[1];
		let max_radius = Math.max(width, height);
		
		for (let r = 1; r < max_radius; r++) {
			let candidates = [];
			
			let check_pixel = (cx, cy) => {
				if (cy < 0 || cy >= height) return;
				let wrapped_x = (cx % width + width) % width;
				if (special_function(options.input_raster, wrapped_x, cy)) {
					candidates.push([wrapped_x, cy]);
				}
			};
			
			for (let dx = -r; dx <= r; dx++) {
				check_pixel(start_x + dx, start_y - r);
				check_pixel(start_x + dx, start_y + r);
			}
			for (let dy = -r + 1; dy <= r - 1; dy++) {
				check_pixel(start_x - r, start_y + dy);
				check_pixel(start_x + r, start_y + dy);
			}
			
			if (candidates.length > 0) {
				let min_dist = Infinity;
				let best_pixel = null;
				
				for (let i = 0; i < candidates.length; i++) {
					let [cx, cy] = candidates[i];
					let c_lng = ((cx + 0.5)/width)*360 - 180;
					let c_lat = 90 - ((cy + 0.5)/height)*180;
					let dist = Geospatiale.haversineDistance([lng, lat], [c_lng, c_lat]);
					
					if (dist < min_dist) {
						min_dist = dist;
						best_pixel = [cx, cy];
					}
				}
				if (best_pixel) return best_pixel;
			}
		}
	};
	
	/**
	 * Returns a [lat, lng] array for a given pixel coordinate.
	 * 
	 * @param {number} arg0_x
	 * @param {number} arg1_y
	 * @param {number} [arg2_width=4320]
	 * @param {number} [arg3_height=2160]
	 * 
	 * @returns {number[]}
	 */
	Geospatiale.getEquirectangularPixelCoords = function (arg0_x, arg1_y, arg2_width, arg3_height) {
		//Convert from parameters
		let x_coord = arg0_x;
		let y_coord = arg1_y;
		let width = Math.returnSafeNumber(arg2_width, 4320);
		let height = Math.returnSafeNumber(arg3_height, 2160);
		
		//Declare local instance variables
		let lat = 90 - (y_coord/height)*180;
		let lng = (x_coord/width)*360 - 180;
		
		//Return statement
		return [lng, lat];
	};
	
	/**
	 * Fetches the x, y coordinate pair for a given pixel given latitude and longitude coordinates for WGS84 Equirectangular.
	 * @alias Geospatiale.getEquirectangularCoordsPixel
	 * 
	 * @param {number} arg0_lng
	 * @param {number} arg1_lat
	 * @param {Object} [arg2_options]
	 *  @param {number} [arg2_options.height=2160] - The height of the image in pixels.
	 *  @param {number} [arg2_options.width=4320] - The width of the image in pixels.
	 *  @param {boolean} [arg2_options.return_object=false] - Whether to return a structured object instead.
	 *
	 * @returns {Array<number, number>|{x_coord: number, y_coord: number}}
	 */
	Geospatiale.getEquirectangularCoordsPixel = function (arg0_lng, arg1_lat, arg2_options) {
		//Convert from parameters
		let longitude = Math.returnSafeNumber(arg0_lng);
		let latitude = Math.returnSafeNumber(arg1_lat);
		let options = (arg2_options) ? arg2_options : {};
		
		//Initialise options
		options.height = Math.returnSafeNumber(options.height, 2160); //5-arcminute resolution default
		options.width = Math.returnSafeNumber(options.width, 4320); //5-arcminute resolution default
		
		//Declare local instance variables
		let bbox = [-180, -90, 180, 90]; //Full Earth latlng
		let x_coord = Math.floor(((longitude - bbox[0])/(bbox[2] - bbox[0]))*options.width);
		let y_coord = Math.floor(((latitude - bbox[1])/(bbox[3] - bbox[1]))*options.height);
		//South Pole is origin by default; flip it to North-facing
		y_coord = options.height - y_coord;
		
		//Return statement
		return (!options.return_object) ?
			[x_coord, y_coord] : { x_coord, y_coord };
	};
}