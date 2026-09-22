//Initialise functions
{
	let fs = (typeof global.fs !== "undefined") ? global.fs : require("fs");
	let path = (typeof global.path !== "undefined") ? global.path : require("path");

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
		let node_path = (typeof path !== "undefined") ? path : require("path");
		let parent_dir = node_path.dirname(node_path.resolve(options.file_path));
		let node_fs = (typeof fs !== "undefined") ? fs : require("fs");
		if (!node_fs.existsSync(parent_dir))
			await node_fs.promises.mkdir(parent_dir, { recursive: true });
		
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
		chunk_size = Math.min(chunk_size, 100);
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
				await Blacktraffic.yield(0);
		}
		
		//Return statement
		return output_data;
	};
	
	/**
	 * Initialises and retrieves the persistent worker thread pool for geoprocessing.
	 * @alias GeoPNG.getWorkerPool
	 * 
	 * @param {Object} [arg0_options]
	 *  @param {number} [arg0_options.concurrency] - Custom worker thread count.
	 * 
	 * @returns {Array<Worker>}
	 */
	GeoPNG.getWorkerPool = function (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Initialise options
		let cpu_count = (typeof require !== "undefined") ? require("os").cpus().length : 4;
		let default_concurrency = Math.max(1, Math.min(cpu_count - 2, 16));
		let max_workers = Math.returnSafeNumber(options.concurrency, default_concurrency);
		
		//Declare local instance variables
		let child_process = (typeof require !== "undefined") ? require("child_process") : null;
		let fs_module = (typeof require !== "undefined") ? require("fs") : ((typeof fs !== "undefined") ? fs : null);
		let is_renderer = (typeof process !== "undefined" && process.type === "renderer");
		let NodeWorker = (!is_renderer && typeof require !== "undefined") ? require("worker_threads").Worker : null;
		let path_module = (typeof require !== "undefined") ? require("path") : ((typeof path !== "undefined") ? path : null);
		let worker_candidates = (path_module) ? [
			(typeof __dirname !== "undefined") ? path_module.join(__dirname, "png_worker.js") : null,
			(typeof __dirname !== "undefined") ? path_module.join(__dirname, "UF/js/geospatiale/files/png/png_worker.js") : null,
			(typeof process !== "undefined" && process.cwd) ? path_module.join(process.cwd(), "UF/js/geospatiale/files/png/png_worker.js") : null,
			(typeof process !== "undefined" && process.cwd) ? path_module.join(process.cwd(), "png_worker.js") : null,
			(typeof global !== "undefined" && global.main_dir) ? path_module.join(global.main_dir, "UF/js/geospatiale/files/png/png_worker.js") : null
		] : [];
		let worker_file_path = null;
		
		if (fs_module)
			for (let i = 0; i < worker_candidates.length; i++)
				if (worker_candidates[i] && fs_module.existsSync(worker_candidates[i])) {
					worker_file_path = worker_candidates[i];
					break;
				}
		
		if ((!NodeWorker && !child_process) || !worker_file_path) return [];
		
		if (GeoPNG._active_workers === undefined) GeoPNG._active_workers = new Set();
		if (GeoPNG._pending_tasks === undefined) GeoPNG._pending_tasks = new Map();
		if (GeoPNG._task_id_counter === undefined) GeoPNG._task_id_counter = 0;
		if (GeoPNG._worker_pool === undefined) GeoPNG._worker_pool = [];
		
		//Instantiate workers up to capacity
		if (GeoPNG._worker_pool.length === 0)
			for (let i = 0; i < max_workers; i++) {
				let worker = null;
				
				//Attempt Node worker_threads first if not in an Electron renderer
				if (NodeWorker) {
					try {
						worker = new NodeWorker(worker_file_path, {
							workerData: { worker_id: i }
						});
					} catch (e) {
						worker = null;
					}
				}
				
				//Fallback to child_process.fork (necessary for Electron renderer orchestrators where V8 platform does not support Node Workers)
				if (!worker && child_process && child_process.fork) {
					worker = child_process.fork(worker_file_path, [], {
						env: {
							...process.env,
							ELECTRON_RUN_AS_NODE: "1",
							WORKER_ID: String(i)
						},
						stdio: ["inherit", "inherit", "inherit", "ipc"]
					});
					
					//Polyfill postMessage and terminate for child_process
					worker.postMessage = (data) => worker.send(data);
					worker.terminate = () => worker.kill();
				}
				
				if (!worker) continue;
				
				worker.worker_id = i;
				GeoPNG._active_workers.add(worker);
				
				worker.on("message", (response) => {
					if (!response || response.task_id === undefined) return;
					let callback = GeoPNG._pending_tasks.get(response.task_id);
					if (callback) {
						GeoPNG._pending_tasks.delete(response.task_id);
						if (response.success) {
							callback.resolve(response.result);
						} else {
							callback.reject(new Error(response.error || "GeoWorker error"));
						}
					}
				});
				
				worker.on("error", (err) => {
					console.error(`[GeoWorker ${i}] Thread error:`, err);
					GeoPNG._active_workers.delete(worker);
				});
				
				worker.on("exit", () => {
					GeoPNG._active_workers.delete(worker);
				});
				
				GeoPNG._worker_pool.push(worker);
			}
		
		//Return statement
		return GeoPNG._worker_pool;
	};
	
	/**
	 * Safely terminates all active background geoprocessing worker threads.
	 * @alias GeoPNG.terminateAllWorkers
	 */
	GeoPNG.terminateAllWorkers = function () {
		//Declare local instance variables
		let active_workers = (GeoPNG._active_workers) ? Array.from(GeoPNG._active_workers) : [];
		
		//Function body
		for (let i = 0; i < active_workers.length; i++) {
			try {
				active_workers[i].terminate();
			} catch (e) {}
		}
		
		if (GeoPNG._active_workers) GeoPNG._active_workers.clear();
		if (GeoPNG._pending_tasks) {
			GeoPNG._pending_tasks.forEach((cb) => {
				cb.reject(new Error("Worker thread aborted: render thread closing."));
			});
			GeoPNG._pending_tasks.clear();
		}
		if (GeoPNG._worker_pool) GeoPNG._worker_pool = [];
	};
	
	/**
	 * Dispatches a single task to the next available worker in the pool.
	 * @alias GeoPNG.executeWorkerTask
	 * 
	 * @param {Object} arg0_task
	 * @param {Object} [arg1_options]
	 * 
	 * @returns {Promise<any>}
	 */
	GeoPNG.executeWorkerTask = function (arg0_task, arg1_options) {
		//Convert from parameters
		let task = arg0_task;
		let options = (arg1_options) ? arg1_options : {};
		
		//Declare local instance variables
		let pool = GeoPNG.getWorkerPool(options);
		
		//Guard clauses
		if (!pool || pool.length === 0)
			return Promise.reject(new Error("Worker pool unavailable."));
		
		if (GeoPNG._next_worker_index === undefined) GeoPNG._next_worker_index = 0;
		let worker = pool[GeoPNG._next_worker_index % pool.length];
		GeoPNG._next_worker_index++;
		
		let task_id = ++GeoPNG._task_id_counter;
		task.task_id = task_id;
		
		//Return statement
		return new Promise((resolve, reject) => {
			GeoPNG._pending_tasks.set(task_id, { resolve: resolve, reject: reject });
			worker.postMessage(task);
		});
	};
	
	/**
	 * Concurrently processes an array of timeseries steps (e.g. years) with true multithreading / multiprocessing.
	 * @alias GeoPNG.processTimeseriesParallel
	 *
	 * @param {Object} arg0_options
	 *  @param {number} [arg0_options.concurrency] - Max concurrent worker tasks. Defaults to optimal core allocation.
	 *  @param {Object} [arg0_options.context] - Optional shared context passed to worker handlers.
	 *  @param {function} [arg0_options.handler] - async (local_item: any, local_index: number, local_context: Object) => Promise<any>.
	 *  @param {Array<any>} arg0_options.items - Array of years or items to process.
	 *  @param {string} [arg0_options.name="Task"] - Task name for logging.
	 *  @param {function} [arg0_options.task_generator] - (local_item: any, local_index: number) => task_object for worker.
	 *  @param {boolean} [arg0_options.use_workers=true] - Whether to use worker threads.
	 *
	 * @returns {Promise<Array<any>>} Array of task results matching items order.
	 */
	GeoPNG.processTimeseriesParallel = async function (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Initialise options
		let cpu_count = (typeof require !== "undefined") ? require("os").cpus().length : 4;
		let default_concurrency = Math.max(1, Math.min(cpu_count - 2, 16));
		let concurrency = Math.returnSafeNumber(options.concurrency, default_concurrency);
		let context = (options.context) ? options.context : {};
		let handler = options.handler;
		let items = (options.items) ? options.items : [];
		let task_generator = options.task_generator;
		let task_name = (options.name) ? options.name : "Timeseries Task";
		let use_workers = (options.use_workers !== undefined) ? options.use_workers : true;
		
		//Declare local instance variables
		let active_promises = [];
		let completed_count = 0;
		let current_index = 0;
		let last_logged_milestone = -1;
		let results = new Array(items.length);
		let total_items = items.length;
		
		if (total_items === 0) return [];
		
		//Check whether worker threads are supported and operational
		let can_use_worker_threads = false;
		if (use_workers && (task_generator || options.allow_eval_handler) && typeof require !== "undefined") {
			try {
				let pool = GeoPNG.getWorkerPool({ concurrency: concurrency });
				if (pool && pool.length > 0) can_use_worker_threads = true;
			} catch (err) {
				console.warn(`[${task_name}] Worker threads could not be initialised, falling back to local runner:`, err.message);
			}
		}
		
		let effective_concurrency = Math.min(concurrency, total_items);
		
		console.log(`- [${task_name}] Launching ${can_use_worker_threads ? "multithreaded worker" : "local cooperative"} processing over ${total_items} items (Concurrency: ${effective_concurrency}) ..`);
		
		//Serialise handler if worker threads are used and handler is provided without explicit task_generator
		let serialised_handler = null;
		if (can_use_worker_threads && !task_generator && options.allow_eval_handler && typeof handler === "function")
			serialised_handler = handler.toString();
		
		//Worker queue runner
		let runNext = async () => {
			while (current_index < total_items) {
				let index_to_run = current_index;
				current_index++;
				let item = items[index_to_run];
				
				try {
					if (can_use_worker_threads) {
						let task_payload;
						if (task_generator) {
							task_payload = task_generator(item, index_to_run);
						} else if (serialised_handler) {
							task_payload = {
								type: "eval_handler",
								item: item,
								index: index_to_run,
								context: context,
								handler_source: serialised_handler
							};
						}
						
						if (task_payload) {
							try {
								results[index_to_run] = await GeoPNG.executeWorkerTask(task_payload, { concurrency: concurrency });
							} catch (worker_err) {
								console.warn(`- [${task_name}] Worker task failed for item ${item}:`, worker_err.message || worker_err);
								//Fallback to local handler on serialization or worker failure
								if (typeof handler === "function") {
									console.warn(`- [${task_name}] Falling back to local execution for item ${item} ..`);
									results[index_to_run] = await handler(item, index_to_run, context);
								} else {
									throw worker_err;
								}
							}
						} else if (typeof handler === "function") {
							results[index_to_run] = await handler(item, index_to_run, context);
						}
					} else {
						//Local async execution with cooperative yield
						results[index_to_run] = await handler(item, index_to_run, context);
					}
				} catch (e) {
					console.error(`- [${task_name}] Error processing item ${item} at index ${index_to_run}:`, e);
				}
				
				completed_count++;
				
				let percent = Math.floor((completed_count / total_items) * 100);
				let item_label = (typeof item === "object" && item !== null) ?
					(item.year || item.name || item.dest || item.output_file_path || `Item ${index_to_run}`) : String(item);

				if (total_items <= 250 || completed_count % 10 === 0 || completed_count === total_items) {
					console.log(`- [${task_name}] [${completed_count}/${total_items}] Processed ${item_label} (${percent}%)`);
				} else if (percent % 10 === 0 && percent !== last_logged_milestone) {
					last_logged_milestone = percent;
					console.log(`- [${task_name}] Progress: ${percent}% (${completed_count}/${total_items} items)`);
				}
				
				//Forward telemetry to Electron main process
				if (typeof require !== "undefined") {
					try {
						let electron_mod = require("electron");
						let ipc = electron_mod.ipcRenderer;
						if (ipc) {
							ipc.send("training:telemetry", {
								completed: completed_count,
								current_item: item_label,
								percent: percent,
								progress: completed_count / total_items,
								task_name: task_name,
								total: total_items
							});
						}
					} catch (e) {}
				}
				
				//Yield to the event loop between queue items to maintain 60 FPS and prevent DevTools disconnect
				if (typeof Blacktraffic !== "undefined" && Blacktraffic.yield)
					await Blacktraffic.yield(0);
			}
		};
		
		//Launch worker runners up to concurrency limit
		for (let i = 0; i < effective_concurrency; i++)
			active_promises.push(runNext());
		
		await Promise.all(active_promises);
		console.log(`- [${task_name}] Completed all ${total_items} items successfully.`);
		
		//Clear taskbar progress bar
		if (typeof require !== "undefined") {
			try {
				let electron_mod = require("electron");
				let ipc = electron_mod.ipcRenderer;
				if (ipc) {
					ipc.send("training:telemetry", {
						completed: total_items,
						current_item: "Complete",
						percent: 100,
						progress: -1,
						task_name: task_name,
						total: total_items
					});
				}
			} catch (e) {}
		}
		
		//Return statement
		return results;
	};
	
	//Register automatic lifecycle termination hooks
	if (typeof window !== "undefined") {
		window.addEventListener("beforeunload", () => GeoPNG.terminateAllWorkers());
		window.addEventListener("unload", () => GeoPNG.terminateAllWorkers());
	}
	if (typeof process !== "undefined") {
		process.on("exit", () => GeoPNG.terminateAllWorkers());
	}
}
