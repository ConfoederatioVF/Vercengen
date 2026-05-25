//[VERCENGEN]

//Import libraries
let fs = require("node:fs");
let path = require("node:path");
let os = require("node:os");
let v8 = require("node:v8");
let readline = require("node:readline");
let NodeWorker = require("node:worker_threads").Worker;

if (!global.NDJSON)
	/**
	 * The namespace for NDJSON utility functions.
	 * 
	 * @namespace NDJSON
	 */
	global.NDJSON = {};

//Initialise functions
{
	/**
	 * Returns a diff over `.history.keyframes` for the ID in question.
	 * IPC: `ndjson:diff` | Callback: `ndjson:diff-ready`.
	 * 
	 * @param {string} arg0_file_path - The .ndjson file to target for a diff.
	 * @param {string} arg1_id
	 * @param {Object} [arg2_options]
	 *  @param {number} [arg2_options.timestamp]
	 * 
	 * @returns {Promise<Object|null>}
	 */
	NDJSON.diff = async function (arg0_file_path, arg1_id, arg2_options) {
		//Convert from parameters
		let file_path = path.resolve(arg0_file_path);
		let id = arg1_id;
		let options = arg2_options ? arg2_options : {};
		
		//Declare local instance variables
		let pool = NDJSON.getWorkerPool();
		let task_id = global.ve.ndjson_task_id_counter++;
		let worker_id = NDJSON.getWorkerID(id, pool.length);
		
		//Return statement
		return new Promise((resolve) => {
			global.ve.ndjson_pending_tasks.set(task_id, resolve);
			pool[worker_id].postMessage({
				type: "diff",
				task_id: task_id,
				file_path: file_path,
				id: id,
				timestamp: options.timestamp
			});
		});
	};
	
	/**
	 * Diffs all `.history.keyframes` for all Objects for a given ID, so long as they have that field.
	 * IPC: `ndjson:diff-all` | Callback: `ndjson:diff-all-ready`.
	 * 
	 * @param {string} arg0_file_path
	 * @param {Object} [arg1_options]
	 *  @param {number} [arg1_options.timestamp]
	 * 
	 * @returns {Promise<Object[]>}
	 */
	NDJSON.diffAll = async function (arg0_file_path, arg1_options) {
		//Convert from parameters
		let file_path = path.resolve(arg0_file_path);
		let options = (arg1_options) ? arg1_options : {};
		
		//Declare local instance variables
		let pool = NDJSON.getWorkerPool();
		let promises = [];
		
		for (let i = 0; i < pool.length; i++) {
			let task_id = global.ve.ndjson_task_id_counter++;
			
			promises.push(new Promise((resolve) => {
				global.ve.ndjson_pending_tasks.set(task_id, resolve);
				pool[i].postMessage({ 
					type: "diff_all", 
					task_id: task_id, 
					file_path: file_path, 
					timestamp: options.timestamp 
				});
			}));
		}
		
		let results = await Promise.all(promises);
		
		//Return statement
		return results.filter(v => v !== null).flat();
	};
	
	/**
	 * Resolves active RAM diagnostic percentage statistics from every worker in the pool.
	 * IPC: `ndjson:get-diagnostics` | Callback: `ndjson:get-diagnostics-ready`.
	 *
	 * @returns {Promise<Array<{worker_id: number, rss: number, heapUsed: number, heapTotal: number, heapLimit: number, percentage: number}>>}
	 */
	NDJSON.getDiagnostics = async function () {
		//Declare local instance variables
		let pool = NDJSON.getWorkerPool();
		let promises = [];
		
		for (let i = 0; i < pool.length; i++) {
			let task_id = global.ve.ndjson_task_id_counter++;
			
			promises.push(new Promise((resolve) => {
				global.ve.ndjson_pending_tasks.set(task_id, resolve);
				pool[i].postMessage({
					type: "get_diagnostics",
					task_id: task_id
				});
			}));
		}
		
		//Return statement
		return await Promise.all(promises);
	};
	
	/**
	 * Returns the Object value of a single ID.
	 * IPC: `ndjson:get-value` | Callback: `ndjson:get-value-ready`.
	 * 
	 * @param {string} arg0_file_path
	 * @param {string} arg1_id
	 * 
	 * @returns {Promise<Object>}
	 */
	NDJSON.getValue = async function (arg0_file_path, arg1_id) {
		//Convert from parameters
		let file_path = path.resolve(arg0_file_path);
		let id = arg1_id;
		
		//Declare local instance variables
		let pool = NDJSON.getWorkerPool();
		let task_id = global.ve.ndjson_task_id_counter++;
		let worker_id = NDJSON.getWorkerID(id, pool.length);
		
		//Return statement
		return new Promise((resolve) => {
			global.ve.ndjson_pending_tasks.set(task_id, resolve);
			pool[worker_id].postMessage({ 
				type: "get_value", 
				task_id: task_id, 
				file_path: file_path,
				id: arg1_id 
			});
		});
	};
	
	/**
	 * Returns the Worker ID that holds a particular ID's partition.
	 * IPC: `ndjson:get-worker-id` | Callback: `ndjson:get-worker-id-ready`.
	 * 
	 * @param {string} arg0_id
	 * @param {number} arg1_pool_length
	 * 
	 * @returns {number}
	 */
	NDJSON.getWorkerID = function (arg0_id, arg1_pool_length) {
		//Convert from parameters
		let id_str = arg0_id.toString();
		let pool_length = arg1_pool_length;
		
		//Declare local instance variables
		let hash = 0;
		
		for (let i = 0; i < id_str.length; i++) {
			hash = ((hash << 5) - hash) + id_str.charCodeAt(i);
			hash |= 0;
		}
		
		//Return statement
		return Math.abs(hash) % pool_length;
	};
	
	/**
	 * Returns the current NDJSON worker pool managing DBs.
	 * IPC: `ndjson:get-worker-pool` | Callback: `ndjson:get-worker-pool-ready`.
	 * 
	 * @param {number} [arg0_max_workers=os.cpus().length - 1]
	 * 
	 * @returns {NodeWorker[]}
	 */
	NDJSON.getWorkerPool = function (arg0_max_workers) {
		//Convert from parameters
		let max_workers = Math.returnSafeNumber(arg0_max_workers, os.cpus().length - 1);
		
		//Init workerpool variables
		if (global.ve.ndjson_pending_tasks === undefined) global.ve.ndjson_pending_tasks = new Map();
		if (global.ve.ndjson_task_id_counter === undefined) global.ve.ndjson_task_id_counter = 0;
		if (global.ve.ndjson_worker_pool === undefined) global.ve.ndjson_worker_pool = [];
		
		//Declare local instance variables
		if (global.ve.ndjson_worker_pool.length === 0)
			for (let i = 0; i < max_workers; i++) {
				let worker = new NodeWorker("./UF/js/vercengen/db/NDJSON_worker.js", { workerData: { worker_id: i } });
				worker.on("message", (response) => {
					let callback = global.ve.ndjson_pending_tasks.get(response.task_id);
					if (callback) {
						callback(response.results !== undefined ? response.results : true);
						global.ve.ndjson_pending_tasks.delete(response.task_id);
					}
				});
				global.ve.ndjson_worker_pool.push(worker);
			}
		
		//Return statement
		return global.ve.ndjson_worker_pool;
	};
	
	/**
	 * Loads a regular JSON file and partitions it into NDJSON files.
	 * 
	 * @param {string} arg0_file_path
	 * @param {Object} [arg1_options]
	 *  @param {number} [arg1_options.dynamic_chunk_size=67108864] - 64MB
	 *  @param {number} [arg1_options.dynamic_max_workers=os.cpus().length - 1]
	 *  @param {number} [arg1_options.ram_threshold] - % Threshold of RAM dedicated to RAM queries.
	 * 
	 * @returns {Promise<unknown>}
	 */
	NDJSON.load = async function (arg0_file_path, arg1_options) {
		//Convert from parameters		
		let file_path = path.resolve(arg0_file_path);
		let options = (arg1_options) ? arg1_options : {};
		
		//Initialise options
		options.dynamic_chunk_size = Math.returnSafeNumber(options.dynamic_chunk_size, 64*1024*1024);
		options.dynamic_max_workers = Math.returnSafeNumber(options.dynamic_max_workers, os.cpus().length - 1);
		options.ram_threshold = Math.returnSafeNumber(options.ram_threshold, 0.50);
		
		//Declare local instance variables
		let _dynamic_chunk_size = structuredClone(options.dynamic_chunk_size);
		let _dynamic_max_workers = structuredClone(options.dynamic_max_workers);
		let heap_limit = v8.getHeapStatistics().heap_size_limit;
		let stats = await fs.promises.stat(file_path);
		
		let active_workers = 0;
		let current_offset = 0;
		let global_depth = 0;
		let write_stream = fs.createWriteStream(`${file_path}.ndjson`);
		
		//Initialise logic functions
		let refreshLimits = () => {
			let memory = process.memoryUsage();
			let memory_usage = memory.heapUsed;
			
			let available_buffer = (heap_limit*options.ram_threshold) - memory_usage;
			
			if (available_buffer < 0) {
				_dynamic_chunk_size = Math.max(1024*1024, _dynamic_chunk_size*0.9);
				_dynamic_max_workers = Math.max(1, _dynamic_max_workers - 1);
			} else {
				_dynamic_chunk_size = Math.min(128*1024*1024, Math.floor(available_buffer*options.ram_threshold));
				_dynamic_max_workers = Math.min(os.cpus().length - 1, _dynamic_max_workers + 1);
			}
		};
		
		//Return statement
		return new Promise((resolve, reject) => {
			let processNextChunk = () => {
				if (current_offset >= stats.size) {
					if (active_workers === 0) {
						write_stream.end(async () => {
							await NDJSON.partitionFile(`${file_path}.ndjson`);
							resolve(`${file_path}.ndjson`);
						});
					}
					return;
				}
				
				refreshLimits();
				if (active_workers < _dynamic_max_workers) {
					let start = current_offset;
					let end = Math.min(start + _dynamic_chunk_size - 1, stats.size - 1);
					
					active_workers++;
					current_offset = end + 1;
					
					let worker = new NodeWorker("./UF/js/vercengen/db/NDJSON_parser.js", {
						workerData: { file_path, start, end, initial_depth: global_depth }
					});
					worker.on("message", (message) => {
						global_depth = message.final_depth;
						let can_write = write_stream.write(message.transformed_data);
						let continueProcessing = () => {
							active_workers--;
							processNextChunk();
						}
						
						if (!can_write) write_stream.once("drain", continueProcessing);
						else setImmediate(continueProcessing);
					});
					worker.on("error", reject);
					
					if (active_workers < _dynamic_max_workers) processNextChunk();
				}
			};
			
			processNextChunk();
		});
	};
	
	/**
	 * Partitions a given file into multiple NDJSON files for use. Internal helper function.
	 * IPC: `ndjson:partition-file` | Callback: `ndjson:partition-file-ready`.
	 * 
	 * @param {string} arg0_file_path
	 * 
	 * @returns {Promise<void>}
	 */
	NDJSON.partitionFile = async function (arg0_file_path) {
		//Convert from parameters
		let file_path = path.resolve(arg0_file_path);
		
		//Declare local instance variables
		let folder_path = `${file_path}.tmpndjson`;
		let pool = NDJSON.getWorkerPool();
		let write_streams = {};
		
		//Iterate over all workers and ensure partitions
		if (!fs.existsSync(folder_path)) fs.mkdirSync(folder_path, { recursive: true });
		for (let i = 0; i < pool.length; i++)
			write_streams[i] = fs.createWriteStream(path.join(folder_path, `${i}.ndjson`));
		
		//Iterate over all lines in rl
		let rl = readline.createInterface({ input: fs.createReadStream(file_path) });
		
		for await (let line of rl) {
			let match = line.match(/^"([^"]+)"\s*:/);
			if (match) {
				let wid = NDJSON.getWorkerID(match[1], pool.length);
				let clean_line = line.trim();
				if (clean_line.endsWith(",")) clean_line = clean_line.slice(0, -1);
				
				if (!write_streams[wid].write(clean_line + "\n"))
					await new Promise(r => write_streams[wid].once("drain", r));
			}
		}
		
		//Iterate over all workers in pool and finish
		for (let i = 0; i < pool.length; i++) {
			write_streams[i].end();
			await new Promise(r => write_streams[i].on("finish", r));
		}
	};
	
	/**
	 * Queries an NDJSON file. [WIP] - Should be refactored so that only `arg1_options` is present.
	 * IPC: `ndjson:query` | Callback: `ndjson:query-ready`.
	 * 
	 * @param {string} arg0_file_path
	 * @param {Object} [arg1_options]
	 *  @param {number} [arg1_options.limit_end]
	 *  @param {number} [arg1_options.limit_start=0]
	 *  @param {Object} [arg1_options.query_obj] - Key/value pairs to match for.
	 * 
	 * @returns {Promise<Object[]>}
	 */
	NDJSON.query = async function (arg0_file_path, arg1_options) {
		//Convert from parameters
		let file_path = path.resolve(arg0_file_path);
		let options = arg1_options ? arg1_options : {};
		
		//Initialise options
		if (!options.query_obj) options.query_obj = {};
		
		//Declare local instance variables
		let limit_end = options.limit_end;
		let limit_start = Math.returnSafeNumber(options.limit_start, 0);
		let pool = NDJSON.getWorkerPool();
		let promises = [];
		
		//Iterate over all workers
		for (let i = 0; i < pool.length; i++) {
			let task_id = global.ve.ndjson_task_id_counter++;
			
			promises.push(new Promise((resolve) => {
				global.ve.ndjson_pending_tasks.set(task_id, resolve);
				pool[i].postMessage({ 
					type: "query",
					task_id: task_id, 
					file_path: file_path, 
					query: options.query_obj, 
					limit_end: limit_end 
				});
			}));
		}
		
		let results = await Promise.all(promises)
		let final_results = results.filter(v => v !== null).flat();
		
		//Return statement
		if (limit_end !== undefined) {
			return final_results.slice(limit_start, limit_end);
		} else if (limit_start > 0) {
			return final_results.slice(limit_start);
		}
		return final_results;
	};
	
	/**
	 * Removes a value from the NDJSON file.
	 * IPC: `ndjson:remove-value` | Callback: `ndjson:remove-value-ready`.
	 * 
	 * @param {string} arg0_file_path
	 * @param {string} arg1_id
	 * 
	 * @returns {Promise<boolean>}
	 */
	NDJSON.removeValue = async function (arg0_file_path, arg1_id) {
		//Convert from parameters
		let file_path = path.resolve(arg0_file_path);
		let id = arg1_id;
		
		//Declare local instance variables
		let map = {};
		map[id] = null;
		
		//Return statement
		return await NDJSON.setValues(file_path, map);
	};
	
	/**
	 * Removes multiple values from the NDJSON file.
	 * IPC: `ndjson:remove-values` | Callback: `ndjson:remove-values-ready`.
	 * 
	 * @param {string} arg0_file_path
	 * @param {string[]} arg1_ids
	 * 
	 * @returns {Promise<boolean>}
	 */
	NDJSON.removeValues = async function (arg0_file_path, arg1_ids) {
		//Convert from parameters
		let file_path = arg0_file_path;
		let ids = arg1_ids;
		
		//Declare local instance variables
		let map = {};
		
		//Iterate over all ids to remove
		for (let i = 0; i < ids.length; i++) 
			map[ids[i]] = null;
		
		//Return statement
		return await NDJSON.setValues(arg0_file_path, map);
	};
	
	/**
	 * Saves the NDJSON file back into the main directory.
	 * IPC: `ndjson:save` | Callback: `ndjson:save-ready`.
	 * 
	 * @param {string} arg0_file_path
	 * 
	 * @returns {Promise<void>}
	 */
	NDJSON.save = async function (arg0_file_path) {
		//Convert from parameters
		let file_path = path.resolve(arg0_file_path);
		
		//Declare local instance variables
		let folder_path = `${file_path}.tmpndjson`;
		let pool = NDJSON.getWorkerPool();
		
		if (!fs.existsSync(folder_path)) return; //Internal guard clause if folder path doesn't exist
		
		let ws = fs.createWriteStream(file_path); // Overwrite target .ndjson
		ws.write("{\n");
		
		//Iterate over all workeers and writee as needed
		let first = true;
		for (let i = 0; i < pool.length; i++) {
			let page_file = path.join(folder_path, `${i}.ndjson`);
			if (fs.existsSync(page_file)) {
				//Iterate over all lines in rl
				let rl = readline.createInterface({ input: fs.createReadStream(page_file) });
				for await (let line of rl) {
					if (line.trim().length === 0) continue;
					if (!first) ws.write(",\n");
					ws.write(line.trim());
					first = false;
				}
			}
		}
		
		ws.write("\n}");
		ws.end();
		await new Promise(r => ws.on("finish", r));
		fs.rmSync(folder_path, { recursive: true, force: true });
	};
	
	/**
	 * Sets a key-value pair in the NDJSON file.
	 * IPC: `ndjson:set-value` | Callback: `ndjson:set-value-ready`.
	 * 
	 * @param {string} arg0_file_path
	 * @param {string} arg1_id
	 * @param {Object} arg2_value
	 * 
	 * @returns {Promise<boolean>}
	 */
	NDJSON.setValue = async function (arg0_file_path, arg1_id, arg2_value) {
		//Convert from parameters
		let file_path = path.resolve(arg0_file_path);
		let id = arg1_id;
		let value = arg2_value;
		
		//Declare local instance variables
		let map = {};
		map[id] = value;
		
		//Return statement
		return await NDJSON.setValues(arg0_file_path, map);
	};
	
	/**
	 * Sets multiple key-value pairs for the NDJSON file.
	 * IPC: `ndjson:set-values` | Callback: `ndjson:set-values-ready`.
	 * 
	 * @param {string} arg0_file_path
	 * @param {Object} arg1_update_map
	 * 
	 * @returns {Promise<boolean>}
	 */
	NDJSON.setValues = async function (arg0_file_path, arg1_update_map) {
		//Convert from parameters
		let file_path = path.resolve(arg0_file_path);
		let update_map = (arg1_update_map) ? arg1_update_map : {};
		
		//Declare local instance variables
		let pool = NDJSON.getWorkerPool();
		let promises = [];
		let updates_by_worker = {};
		
		//Iterate over all keys in update map
		for (let key in update_map) {
			let wid = NDJSON.getWorkerID(key, pool.length);
			if (!updates_by_worker[wid]) updates_by_worker[wid] = {};
			updates_by_worker[wid][key] = update_map[key];
		}
		
		//Iterate over all worker IDs and update values
		for (let wid in updates_by_worker) {
			let task_id = global.NDJSON.task_id_counter++;
			promises.push(new Promise((resolve) => {
				global.ve.ndjson_pending_tasks.set(task_id, resolve);
				pool[wid].postMessage({
					type: "set_values",
					task_id: task_id,
					file_path: file_path,
					update_map: updates_by_worker[wid]
				});
			}));
		}
		
		//Wait for workers to finish
		await Promise.all(promises);
		
		//Return statement
		return true;
	};
}