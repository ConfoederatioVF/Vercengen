//Initialise functions
{
	if (!global.GeoPNG)
		/**
		 * Analogous to a GeoTIFF file format, but in PNG form for easier editing. Single variable. Part of Geospatiale III.
		 * 
		 * @namespace GeoPNG
		 */
		global.GeoPNG = {};
		
	/**
	 * Transforms a PNG raster map to GeoJSON MultiPolygons, ignoring specified colours.
	 * 
	 * @param {string} arg0_file_path
	 * @param {string} arg1_file_path
	 * @param {Object} [arg2_options]
	 *  @param {Array.<number[]>} [arg2_options.ignore_colours] - List of [R, G, B, A] colours to skip.
	 */
	GeoPNG.convertToGeoJSON = async function (arg0_file_path, arg1_file_path, arg2_options) {
		//Convert from parameters
		let input_file_path = arg0_file_path;
		let output_file_path = arg1_file_path;
		
		//Declare local instance variables
		let ignore_set = new Set((arg2_options?.ignore_colours || [])
			.map((c) => c.join(",")));
			ignore_set.add("0,0,0,0");
		let yieldToEventLoop = () => new Promise((resolve) => setImmediate(resolve));
		
		//Load and Parse PNG Asynchronously
		let buffer = await fs.promises.readFile(input_file_path);
		let png_obj = await new Promise((resolve, reject) => {
			new pngjs.PNG().parse(buffer, (err, data) =>
				err ? reject(err) : resolve(data)
			);
		});
		
		let { width, height } = png_obj;
		let res_x = 360/width;
		let res_y = 180/height;
		
		function getPixel(x, y) {
			if (x < 0 || y < 0 || x >= width || y >= height) return "0,0,0,0";
			let idx = (width * y + x) << 2;
			return `${png_obj.data[idx]},${png_obj.data[idx + 1]},${png_obj.data[idx + 2]},${png_obj.data[idx + 3]}`;
		}
		
		let edge_maps = new Map();
		
		function addEdge(rgba, x1, y1, x2, y2) {
			if (!edge_maps.has(rgba)) edge_maps.set(rgba, new Map());
			let color_map = edge_maps.get(rgba);
			let start = `${x1},${y1}`;
			let end = `${x2},${y2}`;
			if (!color_map.has(start)) color_map.set(start, []);
			color_map.get(start).push(end);
		}
		
		
		for (let y = 0; y <= height; y++) {
			//Yield every 500 rows to keep the process responsive
			if (y % 500 === 0) await yieldToEventLoop();
			
			for (let x = 0; x <= width; x++) {
				let current = getPixel(x, y);
				let left = getPixel(x - 1, y);
				let up = getPixel(x, y - 1);
				
				if (current !== up) {
					if (!ignore_set.has(current)) addEdge(current, x, y, x + 1, y);
					if (!ignore_set.has(up)) addEdge(up, x + 1, y, x, y);
				}
				if (current !== left) {
					if (!ignore_set.has(current)) addEdge(current, x, y + 1, x, y);
					if (!ignore_set.has(left)) addEdge(left, x, y, x, y + 1);
				}
			}
		}
		
		let features = [];
		
		for (let [rgba, node_map] of edge_maps.entries()) {
			let multi_polygon_coords = [];
			
			while (node_map.size > 0) {
				let ring = [];
				let start_node = node_map.keys().next().value;
				let current_node = start_node;
				
				while (true) {
					let [px, py] = current_node.split(",").map(Number);
					ring.push([-180 + px * res_x, 90 - py * res_y]);
					
					let neighbors = node_map.get(current_node);
					if (!neighbors || neighbors.length === 0) break;
					
					let next_node = neighbors.pop();
					if (neighbors.length === 0) node_map.delete(current_node);
					
					current_node = next_node;
					if (current_node === start_node) {
						let [sx, sy] = start_node.split(",").map(Number);
						ring.push([-180 + sx * res_x, 90 - sy * res_y]);
						break;
					}
				}
				
				if (ring.length >= 4) {
					multi_polygon_coords.push([ring]);
				}
			}
			
			let [r, g, b, a] = rgba.split(",").map(Number);
			features.push({
				type: "Feature",
				properties: {
					colour: { r, g, b, a },
					rgba: `rgba(${r},${g},${b},${a / 255})`,
				},
				geometry: {
					type: "MultiPolygon",
					coordinates: multi_polygon_coords,
				},
			});
		}
		
		let geojson_obj = { type: "FeatureCollection", features };
		
		//Use a stringify with null/0 indentation to save space
		let output_data = JSON.stringify(geojson_obj);
		await fs.promises.writeFile(output_file_path, output_data);
		
		//Return statement
		return geojson_obj;
	};
	
	/**
	 * Fetches the total sum of all int/float values within an image.
	 * @param {string|Object} [arg0_file_path] - The file path to the image or loaded raster image object.
	 * @param {Object} [arg1_options] 
	 *  @param {string} [arg1_options.format="int32"] - Either 'int32'/'float32'/'greyscale'.
	 *
	 * @returns {number}
	 */
	GeoPNG.getImageSum = function (arg0_file_path, arg1_options) {
		//Convert from parameters
		let file_path = arg0_file_path;
		let options = (arg1_options) ? arg1_options : {};
		
		//Declare local instance variables
		let image = (typeof file_path == "string") ?
			GeoPNG.loadNumberRasterImage(file_path, options) : file_path;
		let total_sum = 0;
		
		//Iterate over image
		for (let i = 0; i < image.data.length; i++)
			total_sum += image.data[i];
		
		//Return statement
		return total_sum;
	};
	
	/**
	 * Fetches the RGBA value of a pixel based on its index.
	 * 
	 * @param {Object|string} arg0_image_object - Image object or file path.
	 * @param {number} arg1_index - Pixel index.
	 * @param {Object} [arg2_options] 
	 *  @param {string} [arg2_options.format="int32"] - Either 'int32'/'float32'/'greyscale'.
	 *
	 * @returns {number[]}
	 */
	GeoPNG.getRGBAFromPixel = function (arg0_image_object, arg1_index, arg2_options) {
		//Convert from parameters
		let options = (arg2_options) ? arg2_options : {};
		let image_obj = (typeof arg0_image_object != "string") ? 
			arg0_image_object : GeoPNG.loadNumberRasterImage(arg0_image_object, options);
		let index = arg1_index*4;
		
		//Return RGBA
		return [
			image_obj.data[index],
			image_obj.data[index + 1],
			image_obj.data[index + 2],
			image_obj.data[index + 3]
		];
	};
	
	/**
	 * Interpolates between two number raster images based on a fraction.
	 *
	 * @param {string|Object} arg0_from_file_path
	 * @param {string|Object} arg1_to_file_path
	 * @param {string} arg2_output_file_path
	 * @param {Object} [arg3_options]
	 *  @param {string} [arg3_options.format="int32"] - Either 'int32'/'float32'.
	 *  @param {number} [arg3_options.fraction=0.5] - The fraction to interpolate between the two images.
	 *  @param {number} [arg3_options.lower_value_threshold] - Lower-bound values that should not be interpolated (from raster).
	 *  @param {number} [arg3_options.upper_value_threshold] - Upper-bound values that should not be interpolated (to raster).
	 *  
	 *  @param {number} [arg3_options.threshold_fraction=0] - 2nd-order fraction to interpolate for values exceeding thresholds.
	 *
	 * @returns {Object}
	 */
	GeoPNG.linearInterpolation = function (arg0_from_file_path, arg1_to_file_path, arg2_output_file_path, arg3_options) {
		//Convert from parameters
		let from_file_path = arg0_from_file_path;
		let to_file_path = arg1_to_file_path;
		let output_file_path = arg2_output_file_path;
		let options = arg3_options ? arg3_options : {};
		
		//Initialise options
		if (!options.format) options.format = "int32";
		if (options.fraction === undefined) options.fraction = 0.5;
		if (options.threshold_fraction === undefined) options.threshold_fraction = 0;
		
		//Declare local instance variables
		let from_image_obj = GeoPNG.loadNumberRasterImage(from_file_path, options);
		let to_image_obj = GeoPNG.loadNumberRasterImage(to_file_path, options);
		
		//Return statement
		return GeoPNG.saveNumberRasterImage({
			file_path: output_file_path,
			format: options.format,
			height: from_image_obj.height,
			width: from_image_obj.width,
			function: function (arg0_index) {
				//Convert from parameters
				let index = arg0_index;
				
				//Declare local instance variables
				let from_val = from_image_obj.data[index];
				let to_val = to_image_obj.data[index];
				
				//Return statement
				if (options.lower_value_threshold !== undefined)
					if (from_val <= options.lower_value_threshold)
						return from_val + (to_val - from_val)*options.threshold_fraction;
				if (options.upper_value_threshold !== undefined)
					if (to_val >= options.upper_value_threshold)
						return from_val + (to_val - from_val)*options.threshold_fraction;
				return from_val + (to_val - from_val)*options.fraction;
			}
		});
	};
	
	/**
	 * Loads an image into the assigned variable.
	 * 
	 * @param {String} arg0_file_path - Input PNG file path.
	 * @param {Object} [arg1_options] 
	 *
	 * @returns {Object}
	 */
	GeoPNG.loadImage = function (arg0_file_path, arg1_options) {
		//Convert from parameters
		let file_path = arg0_file_path;
		let options = (arg1_options) ? arg1_options : {};
		
		//Return statement
		return pngjs.PNG.sync.read(fs.readFileSync(file_path));
	};
	
	/**
	 * Loads an int or float value from a pixel based on its index.
	 * 
	 * @param {Object|string} arg0_image_object - Image object or file path.
	 * @param {number} arg1_index - Pixel index.
	 * @param {Object} [arg2_options] 
	 *  @param {string} [arg2_options.format="int32"] - Either 'int32'/'float32'/'greyscale'.
	 *
	 * @returns {number}
	 */
	GeoPNG.loadNumberFromPixel = function (arg0_image_object, arg1_index, arg2_options) {
		//Convert from parameters
		let options = (arg2_options) ? arg2_options : {};
		let image_obj = (typeof arg0_image_object != "string") ? arg0_image_object : GeoPNG.loadNumberRasterImage(arg0_image_object, options);
		let index = arg1_index;
		
		//Return statement
		return Colour.decodeRGBAAsNumber(GeoPNG.getRGBAFromPixel(image_obj, index, options), options);
	};
	
	/**
	 * Loads a number raster image into the assigned variable.
	 * 
	 * @param {string|Object} arg0_file_path - The file path to load or image object.
	 * @param {Object} [arg1_options] 
	 *  @param {string} [arg1_options.format="int32"] - Either 'int32'/'float32'/'greyscale'.
	 *
	 * @returns {{width: number, height: number, data: Float64Array}|Object}
	 */
	GeoPNG.loadNumberRasterImage = function (arg0_file_path, arg1_options) {
		let file_path = arg0_file_path;
		let options = (arg1_options) ? arg1_options : {};
		if (!options.format) options.format = "int32";
		if (typeof file_path == "object") return file_path;
		
		let rawdata = fs.readFileSync(file_path);
		let png = pngjs.PNG.sync.read(rawdata);
		
		//Float64Array is  safe for scaling calculations
		let pixel_values = new Float64Array(png.width * png.height);
		
		for (let i = 0; i < png.width * png.height; i++) {
			let colour_index = i * 4;
			let local_rgba = [
				png.data[colour_index],
				png.data[colour_index + 1],
				png.data[colour_index + 2],
				png.data[colour_index + 3],
			];
			
			if (options.format === "greyscale") {
				pixel_values[i] = local_rgba[0]/255;
			} else {
				pixel_values[i] = Colour.decodeRGBAAsNumber(local_rgba, options);
			}
		}
		
		//Explicitly nullify the heavy PNG buffer so it can be GC'd immediately
		let height = png.height;
		let width = png.width;
		
		png = null;
		
		return { width: width, height: height, data: pixel_values };
	};
	
	/**
	 * Runs an operation on a raster image for a file.
	 * 
	 * @param {Object} [arg0_options] 
	 *  @param {string} [arg0_options.file_path] - The file path to load from.
	 *  @param {string} [arg0_options.format="int32"] - Either 'int32'/'float32'/'greyscale'.
	 *  @param {function} [arg0_options.function] - (arg0_index, arg1_number)
	 */
	GeoPNG.operateNumberRasterImage = function (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Declare local instance variables
		let image_obj = GeoPNG.loadNumberRasterImage(options.file_path, options);
		
		for (let i = 0; i < image_obj.data.length; i++)
			if (options.function)
				options.function(i*4, image_obj.data[i]);
	};
	
	/**
	 * Saves a number raster image to a file.
	 * 
	 * @param {Object} [arg0_options] 
	 *  @param {string} [arg0_options.file_path] - The file path to save the image to.
	 *  @param {string} [arg0_options.format="int32"] - How to save colours to the end image. Either 'int32'/'float32'/'greyscale'.
	 *  @param {number} [arg0_options.height=1] - The height of the image to save.
	 *  @param {number} [arg0_options.width=1] - The width of the image to save.
	 *  @param {function} [arg0_options.function] - (arg0_index) - The function to apply to each pixel. Must return a number. [0, 0, 0, 0] if undefined.
	 */
	GeoPNG.saveNumberRasterImage = function (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Initialise options
		options.height = Math.returnSafeNumber(options.height, 1);
		options.width = Math.returnSafeNumber(options.width, 1);
		
		if (!options.format) options.format = "int32";
		
		//Declare local instance variables
		let png = new pngjs.PNG({
			height: options.height,
			width: options.width,
			filterType: -1
		});
		
		//Iterate over options.height; options.width
		for (let i = 0; i < options.height; i++)
			for (let x = 0; x < options.width; x++) {
				let local_index = (i*options.width + x); //RGBA index to be multiplied by 4
				
				GeoPNG.saveNumberToPixel(png, local_index, options.function(local_index), options);
			}
		
		//Write PNG file
		fs.writeFileSync(options.file_path, pngjs.PNG.sync.write(png));
		
		//Return statement
		return {
			width: options.width,
			height: options.height,
			data: png.data
		};
	};
	
	/**
	 * Saves a percentage raster image to a file based on a number raster image.
	 * 
	 * @param {string} arg0_input_file_path - The file path to the number raster image to save the percentage raster image from.
	 * @param {string} arg1_output_file_path - The file path to save the percentage raster image to.
	 * @param {Object} [arg2_options] 
	 *  @param {string} [arg2_options.format="int32"] - Either 'int32'/'float32'/'greyscale'.
	 *
	 * @returns {Object}
	 */
	GeoPNG.savePercentageRasterImage = function (arg0_input_file_path, arg1_output_file_path, arg2_options) {
		//Convert from parameters
		let input_file_path = arg0_input_file_path;
		let output_file_path = arg1_output_file_path;
		let options = (arg2_options) ? arg2_options : {};
		
		//Declare local instance variables
		let input_image_obj = GeoPNG.loadNumberRasterImage(input_file_path, options);
		let max_index = -1;
		let max_value = 0;
		
		//1. Fetch max_value
		GeoPNG.operateNumberRasterImage({
			file_path: input_file_path,
			format: options.format,
			width: input_image_obj.width,
			height: input_image_obj.height,
			function: function (arg0_index, arg1_number) {
				//Convert from parameters
				let index = arg0_index;
				let number = arg1_number;
				
				//Set max_value
				if (max_value < number) {
					max_index = index;
					max_value = number;
				}
			}
		});
		
		//2. Save percentage raster image
		let png = new pngjs.PNG({
			height: input_image_obj.height,
			width: input_image_obj.width,
			filterType: -1
		});
		
		//Iterate over all rows and columns
		for (let i = 0; i < input_image_obj.height; i++)
			for (let x = 0; x < input_image_obj.width; x++) {
				let index = (i*input_image_obj.width + x);
				let local_index = index*4; //RGBA index
				let local_value = input_image_obj.data[index];
				
				let local_g = Math.min(Math.round((local_value/max_value)*255), 255);
				let rgba = (local_value) ?
					[0, local_g, 0, 255] : [0, 0, 0, 0];
				
				//Set pixel values
				png.data[local_index] = rgba[0];
				png.data[local_index + 1] = rgba[1];
				png.data[local_index + 2] = rgba[2];
				png.data[local_index + 3] = rgba[3];
			}
		
		//Write PNG file
		fs.writeFileSync(output_file_path, pngjs.PNG.sync.write(png));
		
		//Return statement
		return png;
	};
	
	/**
	 * Saves an int/float value to a pixel based on the corresponding index.
	 * 
	 * @param {string|Object} arg0_image_object - The image object to use.
	 * @param {number} arg1_index - The index of the pixel to save the number to.
	 * @param {number|string} arg2_number - The number to save to the pixel.
	 * @param {Object|string} [arg3_options] - Options object or format string ('int32', 'float32', 'greyscale').
	 *  @param {string} [arg3_options.format="int32"] - Either 'int32'/'float32'/'greyscale'.
	 *
	 * @returns {number[]}
	 */
	GeoPNG.saveNumberToPixel = function (arg0_image_object, arg1_index, arg2_number, arg3_options) {
		//Convert from parameters
		let options = (typeof arg3_options === "object") ? arg3_options : { format: arg3_options };
		if (!options.format) options.format = "int32";
		
		let image_obj = (typeof arg0_image_object != "string") ? 
			arg0_image_object : GeoPNG.loadNumberRasterImage(arg0_image_object, options);
		let index = arg1_index*4;
		let number = arg2_number;
		
		//Declare local instance variables
		let rgba;
			if (options.format === "greyscale") {
				rgba = [parseInt(number*255), parseInt(number*255), parseInt(number*255), 255];
			} else {
				rgba = (number) ? Colour.encodeNumberAsRGBA(number, options) : [0, 0, 0, 0];
			}
		
		image_obj.data[index] = rgba[0];
		image_obj.data[index + 1] = rgba[1];
		image_obj.data[index + 2] = rgba[2];
		image_obj.data[index + 3] = rgba[3];
		
		//Return statement
		return rgba;
	}
}