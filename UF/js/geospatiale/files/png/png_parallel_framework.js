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
	 * Asynchronously loads a number raster image from a PNG file without blocking the event loop.
	 * @alias GeoPNG.loadNumberRasterImageAsync
	 *
	 * @param {string|Object} arg0_file_path - File path or already-parsed raster object.
	 * @param {Object} [arg1_options]
	 *  @param {string} [arg1_options.format="int32"] - 'int32' | 'float32' | 'greyscale'.
	 *
	 * @returns {Promise<{width: number, height: number, data: Float64Array}>}
	 */
	GeoPNG.loadNumberRasterImageAsync = async function (arg0_file_path, arg1_options) {
		//Convert from parameters
		let file_path = arg0_file_path;
		let options = (arg1_options) ? arg1_options : {};
		
		//Initialise options
		if (!options.format) options.format = "int32";
		if (typeof file_path === "object") return file_path;
		
		//Declare local instance variables
		let buffer = await fs.promises.readFile(file_path);
		let png = await new Promise((resolve, reject) => {
			new pngjs.PNG().parse(buffer, (err, data) => (err) ? reject(err) : resolve(data));
		});
		
		let height = png.height;
		let pixel_count = png.width*png.height;
		let pixel_values = new Float64Array(pixel_count);
		let width = png.width;
		
		//Decode pixel values
		for (let i = 0; i < pixel_count; i++) {
			let colour_index = i*4;
			let local_rgba = [
				png.data[colour_index],
				png.data[colour_index + 1],
				png.data[colour_index + 2],
				png.data[colour_index + 3]
			];
			
			if (options.format === "greyscale") {
				pixel_values[i] = local_rgba[0]/255;
			} else {
				pixel_values[i] = Colour.decodeRGBAAsNumber(local_rgba, options);
			}
		}
		
		//Explicitly dereference png to assist garbage collection
		png = null;
		
		//Return statement
		return { width: width, height: height, data: pixel_values };
	};
	
	/**
	 * Asynchronously encodes and writes a number raster image to disk.
	 * @alias GeoPNG.saveNumberRasterImageAsync
	 *
	 * @param {Object} arg0_options
	 *  @param {Float64Array|Float32Array} [arg0_options.data] - Pre-evaluated buffer.
	 *  @param {string} arg0_options.file_path - Destination file path.
	 *  @param {string} [arg0_options.format="int32"] - 'int32' | 'float32' | 'greyscale'.
	 *  @param {function} [arg0_options.function] - (local_index: number) => number.
	 *  @param {number} [arg0_options.height=1]
	 *  @param {number} [arg0_options.width=1]
	 *
	 * @returns {Promise<{width: number, height: number, data: Buffer}>}
	 */
	GeoPNG.saveNumberRasterImageAsync = async function (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Initialise options
		options.height = Math.returnSafeNumber(options.height, 1);
		options.width = Math.returnSafeNumber(options.width, 1);
		if (!options.format) options.format = "int32";
		
		//Declare local instance variables
		let height = options.height;
		let png = new pngjs.PNG({
			filterType: -1,
			height: height,
			width: options.width
		});
		let width = options.width;
		
		//Ensure destination directory exists
		let parent_dir = path.dirname(path.resolve(options.file_path));
		if (!fs.existsSync(parent_dir))
			await fs.promises.mkdir(parent_dir, { recursive: true });
		
		if (options.data) {
			let buffer_data = options.data;
			let pixel_count = width*height;
			
			for (let i = 0; i < pixel_count; i++)
				GeoPNG.saveNumberToPixel(png, i, buffer_data[i], options);
		} else if (options.function) {
			for (let i = 0; i < height; i++)
				for (let x = 0; x < width; x++) {
					let local_index = i*width + x;
					GeoPNG.saveNumberToPixel(png, local_index, options.function(local_index), options);
				}
		}
		
		//Pack and write asynchronously
		let output_buffer = pngjs.PNG.sync.write(png);
		await fs.promises.writeFile(options.file_path, output_buffer);
		
		//Return statement
		return {
			data: png.data,
			height: height,
			width: width
		};
	};
	
	/**
	 * Executes a raster calculation over a 2D domain in parallel using WebGL GPU shaders if available,
	 * or chunked multi-threaded asynchronous processing with cooperative yielding.
	 * @alias GeoPNG.executeParallelRaster
	 *
	 * @param {Object} arg0_options
	 *  @param {number} [arg0_options.chunk_size=500] - Rows per chunk for CPU yielding.
	 *  @param {number} arg0_options.height - Canvas height.
	 *  @param {number} arg0_options.width - Canvas width.
	 *  @param {function} arg0_options.pixel_function - (local_index: number) => number.
	 *  @param {string} [arg0_options.gpu_shader] - Optional WebGL fragment shader source for GPU acceleration.
	 *
	 * @returns {Promise<Float64Array>} Resulting pixel data buffer.
	 */
	GeoPNG.executeParallelRaster = async function (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Initialise options
		let chunk_size = Math.returnSafeNumber(options.chunk_size, 500);
		let height = Math.returnSafeNumber(options.height, 2160);
		let pixel_function = options.pixel_function;
		let width = Math.returnSafeNumber(options.width, 4320);
		
		//Declare local instance variables
		let total_pixels = width*height;
		let output_data = new Float64Array(total_pixels);
		
		//1. Attempt WebGL2 / WebGL GPU acceleration if running in a window / canvas context with shader
		if (options.gpu_shader && typeof document !== "undefined") {
			try {
				let canvas = document.createElement("canvas");
				canvas.width = width;
				canvas.height = height;
				let gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
				
				if (gl) {
					//Compile GPU vertex shader
					let vs_source = `#version 300 es\nin vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }`;
					let vs = gl.createShader(gl.VERTEX_SHADER);
					gl.shaderSource(vs, vs_source);
					gl.compileShader(vs);
					
					//Compile GPU fragment shader
					let fs_shader = gl.createShader(gl.FRAGMENT_SHADER);
					gl.shaderSource(fs_shader, options.gpu_shader);
					gl.compileShader(fs_shader);
					
					if (gl.getShaderParameter(fs_shader, gl.COMPILE_STATUS)) {
						let program = gl.createProgram();
						gl.attachShader(program, vs);
						gl.attachShader(program, fs_shader);
						gl.linkProgram(program);
						gl.useProgram(program);
						
						//Full-screen quad
						let quad_buffer = gl.createBuffer();
						gl.bindBuffer(gl.ARRAY_BUFFER, quad_buffer);
						gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
							-1, -1, 1, -1, -1, 1,
							-1, 1, 1, -1, 1, 1
						]), gl.STATIC_DRAW);
						
						let pos_loc = gl.getAttribLocation(program, "position");
						gl.enableVertexAttribArray(pos_loc);
						gl.vertexAttribPointer(pos_loc, 2, gl.FLOAT, false, 0, 0);
						
						gl.drawArrays(gl.TRIANGLES, 0, 6);
						
						let pixel_buffer = new Uint8Array(width*height*4);
						gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixel_buffer);
						
						for (let i = 0; i < total_pixels; i++) {
							let b_idx = i*4;
							output_data[i] = Colour.decodeRGBAAsNumber([
								pixel_buffer[b_idx],
								pixel_buffer[b_idx + 1],
								pixel_buffer[b_idx + 2],
								pixel_buffer[b_idx + 3]
							], { format: "float32" });
						}
						
						return output_data;
					}
				}
			} catch (gpu_error) {
				console.warn(`- GPU acceleration fallback to multithreaded CPU chunking:`, gpu_error.message);
			}
		}
		
		//2. CPU Chunked Parallel Execution with periodic event-loop yielding
		for (let start_row = 0; start_row < height; start_row += chunk_size) {
			let end_row = Math.min(start_row + chunk_size, height);
			
			for (let y = start_row; y < end_row; y++) {
				let row_offset = y*width;
				for (let x = 0; x < width; x++) {
					let local_index = row_offset + x;
					output_data[local_index] = pixel_function(local_index);
				}
			}
			
			if (typeof Blacktraffic !== "undefined" && Blacktraffic.yield)
				await Blacktraffic.yield();
		}
		
		//Return statement
		return output_data;
	};
	
	/**
	 * Concurrently processes an array of timeseries steps (e.g. years) with a controlled worker pool concurrency limit.
	 * @alias GeoPNG.processTimeseriesParallel
	 *
	 * @param {Object} arg0_options
	 *  @param {number} [arg0_options.concurrency=4] - Max concurrent async worker tasks.
	 *  @param {function} arg0_options.handler - async (local_item: any, local_index: number) => Promise<any>.
	 *  @param {Array<any>} arg0_options.items - Array of years or items to process.
	 *  @param {string} [arg0_options.name="Task"] - Task name for logging.
	 *
	 * @returns {Promise<Array<any>>} Array of task results matching items order.
	 */
	GeoPNG.processTimeseriesParallel = async function (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Initialise options
		let concurrency = Math.returnSafeNumber(options.concurrency, 4);
		let handler = options.handler;
		let items = (options.items) ? options.items : [];
		let task_name = (options.name) ? options.name : "Timeseries Task";
		
		//Declare local instance variables
		let active_promises = [];
		let current_index = 0;
		let results = new Array(items.length);
		let total_items = items.length;
		
		if (total_items === 0) return [];
		
		console.log(`- [${task_name}] Launching parallel processing over ${total_items} items (Concurrency: ${concurrency}) ..`);
		
		//Worker queue runner
		let runNext = async () => {
			while (current_index < total_items) {
				let index_to_run = current_index;
				current_index++;
				let item = items[index_to_run];
				
				try {
					results[index_to_run] = await handler(item, index_to_run);
				} catch (e) {
					console.error(`- [${task_name}] Error processing item ${item} at index ${index_to_run}:`, e);
				}
				
				if (typeof Blacktraffic !== "undefined" && Blacktraffic.yield)
					await Blacktraffic.yield();
			}
		};
		
		//Launch worker threads up to concurrency limit
		let pool_size = Math.min(concurrency, total_items);
		for (let i = 0; i < pool_size; i++)
			active_promises.push(runNext());
		
		await Promise.all(active_promises);
		console.log(`- [${task_name}] Completed all ${total_items} items.`);
		
		//Return statement
		return results;
	};
}
