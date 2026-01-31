//Initialise functions
{
	if (!global.GeoPNG) global.GeoPNG = {};
	
	/**
	 * Fetches the total sum of all int values within an image.
	 * @param {String} [arg0_file_path] - The file path to the image to fetch the sum of.
	 *
	 * @returns {number}
	 */
	GeoPNG.getImageSum = function (arg0_file_path) {
		//Convert from parameters
		let file_path = arg0_file_path;
		
		//Declare local instance variables
		let image = (typeof file_path == "string") ?
			GeoPNG.loadNumberRasterImage(file_path) : file_path;
		let total_sum = 0;
		
		//Iterate over image
		for (let i = 0; i < image.data.length; i++)
			total_sum += image.data[i];
		
		//Return statement
		return total_sum;
	};
	
	/**
	 * getRGBAFromPixel() - Fetches the RGBA value of a pixel based on its index.
	 * @param {Object} arg0_image_object
	 * @param {number} arg1_index
	 *
	 * @returns {[number, number, number, number]}
	 */
	GeoPNG.getRGBAFromPixel = function (arg0_image_object, arg1_index) {
		//Convert from parameters
		let image_obj = (typeof arg0_image_object != "string") ? 
			arg0_image_object : GeoPNG.loadNumberRasterImage(arg0_image_object);
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
	 * loadImage() - Loads an image into the assigned variable.
	 * @param {String} arg0_file_path
	 *
	 * @returns {Object}
	 */
	GeoPNG.loadImage = function (arg0_file_path) {
		//Convert from parameters
		let file_path = arg0_file_path;
		
		//Return statement
		return pngjs.PNG.sync.read(fs.readFileSync(file_path));
	};
	
	/**
	 * loadNumberFromPixel() - Loads an int value from a pixel based on its index.
	 * @param {Object} arg0_image_object
	 * @param {number} arg1_index
	 *
	 * @returns {number}
	 */
	GeoPNG.loadNumberFromPixel = function (arg0_image_object, arg1_index) {
		//Convert from parameters
		let image_obj = (typeof arg0_image_object != "string") ? arg0_image_object : GeoPNG.loadNumberRasterImage(arg0_image_object);
		let index = arg1_index;
		
		//Return statement
		return Colour.decodeRGBAAsNumber(GeoPNG.getRGBAFromPixel(image_obj, index));
	};
	
	/**
	 * loadNumberRasterImage() - Loads a number raster image into the assigned variable.
	 * @param {String} arg0_file_path
	 *
	 * @returns {width: number, height: number, data: number[]}
	 */
	GeoPNG.loadNumberRasterImage = function (arg0_file_path) {
		//Convert from parameters
		let file_path = arg0_file_path;
		
		//Guard clause if file_path is already object
		if (typeof file_path == "object") return file_path;
		
		//Declare local instance variables
		let rawdata = fs.readFileSync(file_path);
		
		let pixel_values = [];
		let png = pngjs.PNG.sync.read(rawdata);
		
		//Iterate over all pixels
		for (let i = 0; i < png.width*png.height; i++) {
			let colour_index = i*4;
			let colour_value = Colour.decodeRGBAAsNumber([
				png.data[colour_index],
				png.data[colour_index + 1],
				png.data[colour_index + 2],
				png.data[colour_index + 3]
			]);
			
			pixel_values.push(colour_value);
		}
		
		//Return statement
		return { width: png.width, height: png.height, data: pixel_values };
	};
	
	/**
	 * operateNumberRasterImage() - Runs an operation on a raster image for a file.
	 * @param {Object} [arg0_options]
	 *  @param {String} [arg0_options.file_path] - The file path to save the image to.
	 *  @param {Function} [arg0_options.function] - (arg0_index, arg1_number)
	 */
	GeoPNG.operateNumberRasterImage = function (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Declare local instance variables
		let image_obj = PNG.loadNumberRasterImage(options.file_path);
		
		for (let i = 0; i < image_obj.data.length; i++)
			if (options.function)
				options.function(i*4, image_obj.data[i]);
	};
	
	/**
	 * saveNumberRasterImage() - Saves a number raster image to a file.
	 * @param {Object} [arg0_options]
	 *  @param {String} [arg0_options.file_path] - The file path to save the image to.
	 *  @param {Number} [arg0_options.width=1] - The width of the image to save.
	 *  @param {Number} [arg0_options.height=1] - The height of the image to save.
	 *  @param {Function} [arg0_options.function] - (arg0_index) - The function to apply to each pixel. Must return a number. [0, 0, 0, 0] if undefined.
	 */
	GeoPNG.saveNumberRasterImage = function (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Initialise options
		options.height = Math.returnSafeNumber(options.height, 1);
		options.width = Math.returnSafeNumber(options.width, 1);
		
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
				
				GeoPNG.saveNumberToPixel(png, local_index, options.function(local_index));
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
	 * savePercentageRasterImage() - Saves a percentage raster image to a file based on a number raster image.
	 * @param {String} arg0_input_file_path - The file path to the number raster image to save the percentage raster image from.
	 * @param {String} arg1_output_file_path - The file path to save the percentage raster image to.
	 *
	 * @returns {Object}
	 */
	GeoPNG.savePercentageRasterImage = function (arg0_input_file_path, arg1_output_file_path) {
		//Convert from parameters
		let input_file_path = arg0_input_file_path;
		let output_file_path = arg1_output_file_path;
		
		//Declare local instance variables
		let input_image_obj = GeoPNG.loadNumberRasterImage(input_file_path);
		let max_index = -1;
		let max_value = 0;
		
		//1. Fetch max_value
		GeoPNG.operateNumberRasterImage({
			file_path: input_file_path,
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
	 * saveNumberToPixel() - Saves an int value to a pixel based on the corresponding index.
	 * @param {String} arg0_image_object - The image object to use.
	 * @param {number} arg1_index - The index of the pixel to save the number to.
	 * @param {number} arg2_number - The number to save to the pixel.
	 *
	 * @returns {[number, number, number, number]}
	 */
	GeoPNG.saveNumberToPixel = function (arg0_image_object, arg1_index, arg2_number) {
		//Convert from parameters
		let image_obj = (typeof arg0_image_object != "string") ? 
			arg0_image_object : GeoPNG.loadNumberRasterImage(arg0_image_object);
		let index = arg1_index*4;
		let number = arg2_number;
		
		//Declare local instance variables
		let rgba = (number) ?
			Colour.encodeNumberAsRGBA(number) : [0, 0, 0, 0];
		
		//Set pixel values
		image_obj.data[index] = rgba[0];
		image_obj.data[index + 1] = rgba[1];
		image_obj.data[index + 2] = rgba[2];
		image_obj.data[index + 3] = rgba[3];
		
		//Return statement
		return rgba;
	}
}