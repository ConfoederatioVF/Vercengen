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
	
//Initialise utils
{
	/**
	 * Returns the resolved base file path for the active NDJSON / savefile database.
	 *
	 * @returns {string}
	 */
	NDJSON.getFilePath = function () {
		let raw_path = global.ve?.naissance_file_path || global.ve?.ndjson_file_path;
		if (!raw_path || typeof raw_path !== "string") return "";
		return path.resolve(raw_path.replace(/\.ndjson$/, ""));
	};
	
	/**
	 * Returns the unified cache partition directory in saves/.cache.
	 *
	 * @param {string} [arg0_file_path]
	 *
	 * @returns {string}
	 */
	NDJSON.getCacheDirectory = function (arg0_file_path) {
		let file_path = (arg0_file_path) ? arg0_file_path : NDJSON.getFilePath();
		let base_name = (file_path) ? path.basename(file_path, path.extname(file_path)) : "current";
		return path.resolve(process.cwd(), "saves/.cache", base_name);
	};
	NDJSON.getTempDirectory = NDJSON.getCacheDirectory;
	
	/**
	 * Internal helper to route multi-ID tasks across worker partitions and format ordered responses.
	 *
	 * @param {string[]} arg0_ids
	 * @param {string} arg1_type
	 * @param {Object} [arg2_payload={}]
	 *
	 * @returns {Promise<Array<Object|null>>}
	 * @private
	 */
	NDJSON._getMulti = async function (arg0_ids, arg1_type, arg2_payload) {
		//Convert from parameters
		let ids = Array.isArray(arg0_ids) ? arg0_ids : [];
		let payload = arg2_payload || {};
		
		//Declare local instance variables
		let pool = NDJSON.getWorkerPool();
		let ids_by_worker = {};
		
		for (let i = 0; i < ids.length; i++) {
			let wid = NDJSON.getWorkerID(ids[i], pool.length);
			if (!ids_by_worker[wid]) ids_by_worker[wid] = [];
			ids_by_worker[wid].push(ids[i]);
		}
		
		let target_wids = Object.keys(ids_by_worker).map(Number);
		let file_path = NDJSON.getFilePath();
		if (!file_path) return ids.map(() => null);
		
		let results = await NDJSON.task(target_wids, (wid) => ({
			type: arg1_type,
			file_path: file_path,
			ids: ids_by_worker[wid],
			...payload
		}));
		
		let merged_map = {};
		for (let i = 0; i < results.length; i++) {
			let res = results[i];
			if (res) Object.assign(merged_map, res);
		}
		
		//Return statement
		return ids.map((id) =>
			merged_map.hasOwnProperty(id) ? merged_map[id] : null
		);
	};
	
	/**
	 * Internal dispatcher to handle messaging and promise queues across worker pools.
	 *
	 * @param {number|number[]|string} arg0_target - Target worker ID, array of IDs, partition ID string, or "all".
	 * @param {Object|Function} arg1_message - Message payload, or a factory function returning payload.
	 *
	 * @returns {Promise<any|any[]>}
	 */
	NDJSON.task = function (arg0_target, arg1_message) {
		//Guard clauses
		if (NDJSON.is_terminating)
			return (arg0_target === "all" || Array.isArray(arg0_target)) ? Promise.resolve([]) : Promise.resolve(null);
		
		//Declare local instance variables
		let is_array = false;
		let pool = NDJSON.getWorkerPool();
		let worker_ids = [];
		
		if (!pool || pool.length === 0)
			return (arg0_target === "all" || Array.isArray(arg0_target)) ? Promise.resolve([]) : Promise.resolve(null);
		
		if (arg0_target === "all") {
			worker_ids = pool.map((_, i) => i);
			is_array = true;
		} else if (Array.isArray(arg0_target)) {
			worker_ids = arg0_target;
			is_array = true;
		} else if (typeof arg0_target === "string") {
			worker_ids = [NDJSON.getWorkerID(arg0_target, pool.length)];
			is_array = false;
		} else if (typeof arg0_target === "number") {
			worker_ids = [arg0_target];
			is_array = false;
		}
		
		let promises = worker_ids.map((wid) => {
			let task_id = global.ve.ndjson_task_id_counter++;
			let message = typeof arg1_message === "function"
				? arg1_message(wid)
				: { ...arg1_message };
			
			message.task_id = task_id;
			
			return new Promise((resolve) => {
				global.ve.ndjson_pending_tasks.set(task_id, resolve);
				try {
					if (pool[wid]) {
						pool[wid].postMessage(message);
					} else {
						global.ve.ndjson_pending_tasks.delete(task_id);
						resolve(null);
					}
				} catch (err) {
					console.error(`[NDJSON.task] Failed to postMessage to worker ${wid}:`, err);
					global.ve.ndjson_pending_tasks.delete(task_id);
					resolve(null);
				}
			});
		});
		
		//Return statement
		return is_array ? Promise.all(promises) : promises[0];
	};
}

//Initialise functions
{
	/**
	 * Returns a diff over `.history.keyframes` for the ID in question.
	 * 
	 * @param {string} arg0_id
	 * @param {Object} arg1_timestamp
	 *
	 * @returns {Promise<Object|null>}
	 */
	NDJSON.diff = async function (arg0_id, arg1_timestamp) {
		//Convert from parameters
		let id = arg0_id;
		let timestamp = arg1_timestamp;
		let file_path = NDJSON.getFilePath();
		if (!file_path) return null;
		
		//Return statement
		return NDJSON.task(id, {
			type: "diff",
			file_path: file_path,
			id: id,
			timestamp: timestamp
		});
	};
	
	/**
	 * Diffs all `.history.keyframes` for all Objects for a given ID, so long as they have that field.
	 *
	 * @param {number|string} arg0_timestamp
	 *
	 * @returns {Promise<Object[]>}
	 */
	NDJSON.diffAll = async function (arg0_timestamp) {
		//Convert from parameters
		let timestamp = parseInt(arg0_timestamp);
		let file_path = NDJSON.getFilePath();
		if (!file_path) return [];
		
		//Declare local instance variables
		let results = await NDJSON.task("all", {
			type: "diff_all",
			file_path: file_path,
			timestamp: timestamp
		});
		
		//Return statement
		return results.filter(v => v !== null).flat();
	};
	
	/**
	 * Returns diffs over `.history.keyframes` for entities intersecting the bounding box at the given timestamp.
	 *
	 * @param {Object} [arg0_options]
	 *  @param {number[]} [arg0_options.bbox] - [min_x, min_y, max_x, max_y]
	 *  @param {number|string} arg0_options.timestamp
	 *  @param {number} [arg0_options.zoom]
	 *
	 * @returns {Promise<Object[]>}
	 */
	NDJSON.diffBBox = async function (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		let bbox = options.bbox;
		let timestamp = parseInt(options.timestamp);
		let zoom = options.zoom;
		let file_path = NDJSON.getFilePath();
		if (!file_path) return [];
		
		//Declare local instance variables
		let results = await NDJSON.task("all", {
			type: "diff_bbox",
			file_path: file_path,
			timestamp: timestamp,
			bbox: bbox,
			zoom: zoom
		});
		
		//Return statement
		return results.filter(v => v !== null).flat();
	};
	
	/**
	 * Resolves active RAM diagnostic percentage statistics from every worker in the pool.
	 *
	 * @returns {Promise<Array<{worker_id: number, rss: number, heapUsed: number, heapTotal: number, heapLimit: number, percentage: number}>>}
	 */
	NDJSON.getDiagnostics = async function () {
		//Return statement
		return await NDJSON.task("all", {
			type: "get_diagnostics"
		});
	};
	
	/**
	 * Returns diffs over `.history.keyframes` for multiple IDs in 1-pass.
	 *
	 * @param {string[]} arg0_ids
	 * @param {number} arg1_timestamp
	 *
	 * @returns {Promise<Array<Object|null>>}
	 */
	NDJSON.getDiffs = async function (arg0_ids, arg1_timestamp) {
		//Convert from parameters
		let ids = arg0_ids;
		let timestamp = arg1_timestamp;
		
		//Return statement
		return NDJSON._getMulti(ids, "get_diffs", {
			timestamp: timestamp
		});
	};
	
	NDJSON.getHierarchyValues = async function (arg0_timestamp) {
		//Convert from parameters
		let timestamp = parseInt(arg0_timestamp);
		let file_path = NDJSON.getFilePath();
		if (!file_path) return [];
		
		//Declare local instance variables
		let results = await NDJSON.task("all", {
			type: "get_hierarchy_values",
			file_path: file_path,
			timestamp: timestamp
		});
		
		//Return statement
		return results.filter(v => v !== null).flat();
	};
	
	/**
	 * Returns all unique global timestamps from all partitions.
	 *
	 * @returns {Promise<number[]>}
	 */
	NDJSON.getTimestamps = async function () {
		let file_path = NDJSON.getFilePath();
		if (!file_path) return [];
		
		let results = await NDJSON.task("all", {
			file_path: file_path,
			type: "get_timestamps"
		});
		
		let merged = new Set();
		for (let i = 0; i < results.length; i++) {
			let arr = results[i];
			if (Array.isArray(arr)) {
				for (let x = 0; x < arr.length; x++)
					merged.add(Number(arr[x]));
			}
		}
		
		//Return statement
		return Array.from(merged).sort((a, b) => a - b);
	};
	
	/**
	 * Returns the Object values of multiple IDs in 1-pass.
	 *
	 * @param {string[]} arg0_ids
	 *
	 * @returns {Promise<Array<Object|null>>}
	 */
	NDJSON.getValues = async function (arg0_ids) {
		//Convert from parameters
		let ids = arg0_ids;
		
		//Return statement
		return NDJSON._getMulti(ids, "get_values");
	};
	
	/**
	 * Returns processed `.history.keyframes` for a given key.
	 *
	 * @param {string} arg0_id
	 *
	 * @returns {Promise<Object>}
	 */
	NDJSON.getKeyframes = async function (arg0_id) {
		//Convert from parameters
		let id = arg0_id;
		let file_path = NDJSON.getFilePath();
		if (!file_path) return {};
		
		//Return statement
		return NDJSON.task(id, {
			type: "get_keyframes",
			file_path: file_path,
			id: id
		});
	};
	
	/**
	 * Returns the Object value of a single ID.
	 *
	 * @param {string} arg0_id
	 *
	 * @returns {Promise<Object>}
	 */
	NDJSON.getValue = async function (arg0_id) {
		//Convert from parameters
		let id = arg0_id;
		let file_path = NDJSON.getFilePath();
		if (!file_path) return null;
		
		//Return statement
		return NDJSON.task(id, {
			type: "get_value",
			file_path: file_path,
			id: id
		});
	};
	
	/**
	 * Returns the Worker ID that holds a particular ID's partition.
	 *
	 * @param {string} arg0_id
	 * @param {number} arg1_pool_length
	 *
	 * @returns {number}
	 */
	NDJSON.getWorkerID = function (arg0_id, arg1_pool_length) {
		//Convert from parameters
		let id_str = arg0_id.toString();
		let pool_length = Math.max(1, arg1_pool_length || 1);
		
		//Declare local instance variables
		let hash = 2166136261;
		
		for (let i = 0; i < id_str.length; i++) {
			hash ^= id_str.charCodeAt(i);
			hash = Math.imul(hash, 16777619);
		}
		
		//Return statement
		return (hash >>> 0) % pool_length;
	};
	
	/**
	 * Returns the current NDJSON worker pool managing DBs.
	 *
	 * @param {number} [arg0_max_workers=os.cpus().length - 1]
	 *
	 * @returns {NodeWorker[]}
	 */
	NDJSON.getWorkerPool = function (arg0_max_workers) {
		//Convert from parameters
		let default_workers = Math.max(1, Math.min(8, os.cpus().length - 1));
		let max_workers = (typeof Math.returnSafeNumber === "function") ?
			Math.returnSafeNumber(arg0_max_workers, default_workers) :
			((typeof arg0_max_workers === "number" && !isNaN(arg0_max_workers)) ? arg0_max_workers : default_workers);
		max_workers = Math.max(1, Math.min(32, max_workers));
		
		//Init workerpool variables
		if (global.ve === undefined) global.ve = {};
		if (global.ve.ndjson_pending_tasks === undefined) global.ve.ndjson_pending_tasks = new Map();
		if (global.ve.ndjson_task_id_counter === undefined) global.ve.ndjson_task_id_counter = 0;
		if (global.ve.ndjson_worker_pool === undefined) global.ve.ndjson_worker_pool = [];
		
		//Declare local instance variables
		if (global.ve.ndjson_worker_pool.length === 0) {
			let worker_script = path.resolve(__dirname, "NDJSON_worker.js");
			let createWorker = function (worker_id) {
				let worker = new NodeWorker(worker_script, {
					resourceLimits: {
						maxOldGenerationSizeMb: 8192,
						maxYoungGenerationSizeMb: 512
					},
					workerData: { worker_id: worker_id }
				});
				worker.on("message", (response) => {
					let callback = global.ve.ndjson_pending_tasks.get(response.task_id);
					if (callback) {
						callback(response.results !== undefined ? response.results : true);
						global.ve.ndjson_pending_tasks.delete(response.task_id);
					}
				});
				worker.on("error", (err) => {
					console.error(`[NDJSON_main] Worker ${worker_id} encountered error:`, err);
				});
				worker.on("exit", (code) => {
					if (code !== 0 && !NDJSON.is_terminating) {
						console.warn(`[NDJSON_main] Worker ${worker_id} exited with code: ${code}. Respawning worker...`);
						try {
							let replacement = createWorker(worker_id);
							global.ve.ndjson_worker_pool[worker_id] = replacement;
							let file_path = NDJSON.getFilePath();
							if (file_path) {
								replacement.postMessage({
									file_path: file_path,
									task_id: global.ve.ndjson_task_id_counter++,
									type: "init_partition"
								});
							}
						} catch (respawn_err) {
							console.error(`[NDJSON_main] Failed to respawn worker ${worker_id}:`, respawn_err);
						}
					}
				});
				return worker;
			};
			
			for (let i = 0; i < max_workers; i++) {
				let worker = createWorker(i);
				global.ve.ndjson_worker_pool.push(worker);
			}
		}
		
		//Return statement
		return global.ve.ndjson_worker_pool;
	};
	
	/**
	 * Terminates all workers in the NDJSON worker pool cleanly.
	 *
	 * @returns {Promise<void>}
	 */
	NDJSON.terminate = async function () {
		NDJSON.is_terminating = true;
		if (global.ve?.ndjson_pending_tasks) {
			for (let [task_id, callback] of global.ve.ndjson_pending_tasks) {
				try { callback(null); } catch (e) {}
			}
			global.ve.ndjson_pending_tasks.clear();
		}
		if (global.ve?.ndjson_worker_pool) {
			let pool = global.ve.ndjson_worker_pool;
			global.ve.ndjson_worker_pool = [];
			for (let i = 0; i < pool.length; i++) {
				try {
					await pool[i].terminate();
				} catch (e) {}
			}
		}
		NDJSON.is_terminating = false;
	};
	
	/**
	 * Adjusts the concurrent thread pool size for DB workers dynamically.
	 *
	 * @param {number} arg0_count
	 *
	 * @returns {Promise<number>}
	 */
	NDJSON.setWorkerPoolSize = async function (arg0_count) {
		//Convert from parameters
		let new_count = Math.max(1, Math.min(32, parseInt(arg0_count) || 1));
		let current_count = global.ve?.ndjson_worker_pool ? global.ve.ndjson_worker_pool.length : 0;
		if (new_count === current_count) return current_count;
		
		await NDJSON.terminate();
		let pool = NDJSON.getWorkerPool(new_count);
		let current_file = NDJSON.getFilePath();
		if (current_file && fs.existsSync(current_file)) {
			await NDJSON.load(current_file, { dynamic_max_workers: new_count, repartition: true });
		}
		
		//Return statement
		return pool.length;
	};
	
	/**
	 * Loads a regular JSON / .naissance file and streams it into partitioned NDJSON shard files.
	 *
	 * @param {string} arg0_file_path
	 * @param {Object} [arg1_options]
	 *  @param {number} [arg1_options.dynamic_max_workers]
	 *
	 * @returns {Promise<string>}
	 */
	NDJSON.load = async function (arg0_file_path, arg1_options) {
		//Convert from parameters
		let file_path = path.resolve(arg0_file_path);
		let options = (arg1_options) ? arg1_options : {};
		
		//Initialise options
		let default_workers = Math.max(1, Math.min(8, os.cpus().length - 1));
		let max_workers = (typeof options.dynamic_max_workers === "number" && !isNaN(options.dynamic_max_workers)) ?
			Math.max(1, Math.min(32, options.dynamic_max_workers)) :
			((global.ve?.ndjson_worker_pool?.length > 0) ? global.ve.ndjson_worker_pool.length : default_workers);
		
		//Declare local instance variables
		let folder_path = NDJSON.getCacheDirectory(file_path);
		let legacy_temp = path.resolve(process.cwd(), "saves/.temp", path.basename(file_path, path.extname(file_path)));
		
		if (!fs.existsSync(folder_path) && fs.existsSync(legacy_temp)) {
			try {
				fs.mkdirSync(path.dirname(folder_path), { recursive: true });
				fs.renameSync(legacy_temp, folder_path);
			} catch (e) {
				console.warn("[NDJSON] Could not migrate legacy temp to cache:", e);
			}
		}
		
		//Check if cached partitions are valid
		let cached_partitions = [];
		let is_cache_valid = false;
		
		if (fs.existsSync(folder_path)) {
			try {
				let leftover_tmps = fs.readdirSync(folder_path).filter((f) => f.includes(".tmp_"));
				for (let tf of leftover_tmps)
					try { fs.unlinkSync(path.join(folder_path, tf)); } catch (e) {}
			} catch (e) {}
		}
		
		if (fs.existsSync(folder_path) && !options.repartition && !options.force_reload) {
			cached_partitions = fs.readdirSync(folder_path).filter((f) => f.startsWith("partition_") && f.endsWith(".ndjson"));
			let metadata_path = path.join(folder_path, "metadata.json");
			let p0_path = path.join(folder_path, "partition_0.ndjson");
			
			if (cached_partitions.length === max_workers && fs.existsSync(metadata_path) && fs.existsSync(p0_path)) {
				try {
					let file_stat = fs.existsSync(file_path) ? fs.statSync(file_path) : null;
					let meta_stat = fs.statSync(metadata_path);
					let p0_stat = fs.statSync(p0_path);
					
					if (p0_stat.size > 0 && (!file_stat || meta_stat.mtimeMs >= file_stat.mtimeMs - 2000))
						is_cache_valid = true;
				} catch (e) {}
			}
		}
		
		if (is_cache_valid) {
			console.log(`[NDJSON] Reusing cached partitions in ${folder_path} (${cached_partitions.length} partitions)`);
			let pool = NDJSON.getWorkerPool(cached_partitions.length);
			if (pool.length !== cached_partitions.length) {
				await NDJSON.terminate();
				pool = NDJSON.getWorkerPool(cached_partitions.length);
			}
			if (!global.ve) global.ve = {};
			global.ve.naissance_file_path = file_path;
			global.ve.ndjson_file_path = path.join(folder_path, "partition_0.ndjson");
			
			let pool_indices = pool.map((_, i) => i);
			for (let b = 0; b < pool_indices.length; b += 2) {
				let batch = pool_indices.slice(b, b + 2);
				await NDJSON.task(batch, {
					file_path: file_path,
					type: "init_partition"
				});
			}
			
			return global.ve.ndjson_file_path;
		}
		
		let pool = NDJSON.getWorkerPool(max_workers);
		if (pool.length !== max_workers) {
			await NDJSON.terminate();
			pool = NDJSON.getWorkerPool(max_workers);
		}
		let write_streams = {};
		
		if (!global.ve) global.ve = {};
		global.ve.naissance_file_path = file_path;
		global.ve.ndjson_file_path = path.join(folder_path, "partition_0.ndjson");
		
		//Ensure folder path inside saves/.cache and clean up stale partitions
		if (!fs.existsSync(folder_path)) {
			fs.mkdirSync(folder_path, { recursive: true });
		} else {
			let old_files = fs.readdirSync(folder_path);
			for (let ofile of old_files) {
				if (ofile.startsWith("partition_") && ofile.endsWith(".ndjson")) {
					try { fs.unlinkSync(path.join(folder_path, ofile)); } catch (e) {}
				}
			}
		}
		
		for (let i = 0; i < pool.length; i++)
			write_streams[i] = fs.createWriteStream(path.join(folder_path, `partition_${i}.ndjson`));
		
		let metadata_ws = fs.createWriteStream(path.join(folder_path, "metadata.json"));
		
		//Stream file and parse top-level entries
		let in_string = false;
		let is_escaped = false;
		let depth = 0;
		let root_opened = false;
		let state = "SEEK_KEY"; // SEEK_KEY, IN_KEY, SEEK_COLON, IN_VAL
		let key_start = -1;
		let val_start = -1;
		let key_chunks = [];
		let val_chunks = [];
		
		let writeEntry = async (key, val_str) => {
			if (key === "map_settings") {
				let can_write = metadata_ws.write(val_str);
				if (!can_write)
					await new Promise((r) => metadata_ws.once("drain", r));
			} else {
				let wid = NDJSON.getWorkerID(key, pool.length);
				let can_write = write_streams[wid].write(`"${key}":${val_str}\n`);
				if (!can_write)
					await new Promise((r) => write_streams[wid].once("drain", r));
			}
		};
		
		let rs = fs.createReadStream(file_path, { highWaterMark: 1024*1024 });
		
		for await (let chunk of rs) {
			let str = typeof chunk === "string" ? chunk : chunk.toString("utf8");
			let len = str.length;
			let i = 0;
			
			while (i < len) {
				let ch = str[i];
				
				if (is_escaped) {
					is_escaped = false;
					i++;
					continue;
				}
				
				if (ch === "\\") {
					is_escaped = true;
					i++;
					continue;
				}
				
				if (ch === '"') {
					in_string = !in_string;
					if (state === "SEEK_KEY" && in_string && depth === 1) {
						state = "IN_KEY";
						key_start = i + 1;
					} else if (state === "IN_KEY" && !in_string) {
						state = "SEEK_COLON";
						if (key_start !== -1) {
							key_chunks.push(str.slice(key_start, i));
							key_start = -1;
						}
					}
					i++;
					continue;
				}
				
				if (in_string) {
					i++;
					continue;
				}
				
				if (!root_opened) {
					if (ch === "{") {
						root_opened = true;
						depth = 1;
					}
					i++;
					continue;
				}
				
				if (state === "SEEK_COLON") {
					if (ch === ":") {
						state = "IN_VAL";
						val_start = i + 1;
					}
					i++;
					continue;
				}
				
				if (state === "SEEK_KEY") {
					if (ch === "}") {
						depth = 0;
						break;
					}
					i++;
					continue;
				}
				
				if (state === "IN_VAL") {
					if (ch === "{" || ch === "[") {
						depth++;
					} else if (ch === "}" || ch === "]") {
						depth--;
						if (depth === 1) {
							if (val_start !== -1) {
								val_chunks.push(str.slice(val_start, i + 1));
								val_start = -1;
							}
							let key = key_chunks.join("");
							let val = val_chunks.join("").trim();
							state = "SEEK_KEY";
							key_chunks = [];
							val_chunks = [];
							await writeEntry(key, val);
						} else if (depth === 0) {
							break;
						}
					} else if (ch === "," && depth === 1) {
						if (val_start !== -1) {
							val_chunks.push(str.slice(val_start, i));
							val_start = -1;
						}
						let key = key_chunks.join("");
						let val = val_chunks.join("").trim();
						state = "SEEK_KEY";
						key_chunks = [];
						val_chunks = [];
						await writeEntry(key, val);
					}
				}
				i++;
			}
			
			if (state === "IN_KEY" && key_start !== -1) {
				key_chunks.push(str.slice(key_start, len));
				key_start = 0;
			}
			if (state === "IN_VAL" && val_start !== -1) {
				val_chunks.push(str.slice(val_start, len));
				val_start = 0;
			}
		}
		
		//Close all write handles
		metadata_ws.end();
		await new Promise((r) => metadata_ws.on("finish", r));
		
		for (let i = 0; i < pool.length; i++) {
			write_streams[i].end();
			await new Promise((r) => write_streams[i].on("finish", r));
		}
		
		//Notify all workers to index their partition in memory
		let pool_indices = pool.map((_, i) => i);
		for (let b = 0; b < pool_indices.length; b += 2) {
			let batch = pool_indices.slice(b, b + 2);
			await NDJSON.task(batch, {
				file_path: file_path,
				type: "init_partition"
			});
		}
		
		//Return statement
		return global.ve.ndjson_file_path;
	};
	
	/**
	 * Partitions a given file into multiple NDJSON files for use. Internal helper function.
	 *
	 * @param {string} arg0_file_path
	 *
	 * @returns {Promise<void>}
	 */
	NDJSON.partitionFile = async function (arg0_file_path) {
		//Convert from parameters
		let file_path = path.resolve(arg0_file_path);
		
		//Return statement
		await NDJSON.load(file_path);
	};
	
	/**
	 * Queries an NDJSON file. [WIP] - Should be refactored so that only `arg1_options` is present.
	 *
	 * @param {Object} [arg0_options]
	 *  @param {number} [arg0_options.limit_end]
	 *  @param {number} [arg0_options.limit_start=0]
	 *  @param {Object} [arg0_options.query_obj] - Key/value pairs to match for.
	 *
	 * @returns {Promise<Object[]>}
	 */
	NDJSON.query = async function (arg0_options) {
		//Convert from parameters
		let options = arg0_options ? arg0_options : {};
		
		//Initialise options
		if (!options.query_obj) options.query_obj = {};
		
		//Declare local instance variables
		let limit_end = options.limit_end;
		let limit_start = Math.returnSafeNumber(options.limit_start, 0);
		let file_path = NDJSON.getFilePath();
		if (!file_path) return [];
		
		let results = await NDJSON.task("all", {
			type: "query",
			file_path: file_path,
			query: options.query_obj,
			limit_end: limit_end
		});
		
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
	 *
	 * @param {string} arg0_id
	 *
	 * @returns {Promise<boolean>}
	 */
	NDJSON.removeValue = async function (arg0_id) {
		//Convert from parameters
		let id = arg0_id;
		
		//Declare local instance variables
		let map = {};
		map[id] = null;
		
		//Return statement
		return await NDJSON.setValues(map);
	};
	
	/**
	 * Removes multiple values from the NDJSON file.
	 *
	 * @param {string[]} arg0_ids
	 *
	 * @returns {Promise<boolean>}
	 */
	NDJSON.removeValues = async function (arg0_ids) {
		//Convert from parameters
		let ids = arg0_ids;
		
		//Declare local instance variables
		let map = {};
		
		//Iterate over all ids to remove
		for (let i = 0; i < ids.length; i++)
			map[ids[i]] = null;
		
		//Return statement
		return await NDJSON.setValues(map);
	};
	
	/**
	 * Saves the NDJSON file back into the main directory.
	 *
	 * @returns {Promise<void>}
	 */
	/**
	 * Saves the NDJSON partitions back into a 100% compliant .naissance file.
	 *
	 * @param {string} [arg0_target_path]
	 *
	 * @returns {Promise<string>}
	 */
	NDJSON.save = async function (arg0_target_path) {
		//Convert from parameters
		let target_path = (arg0_target_path) ?
			path.resolve(arg0_target_path) :
			path.resolve(global.ve?.naissance_file_path || global.ve?.ndjson_file_path?.replace(/\.ndjson$/, ""));
		
		//Declare local instance variables
		let bak_path = `${target_path}.bak`;
		let comma_newline = Buffer.from(",\n");
		let file_path = path.resolve(global.ve?.naissance_file_path || global.ve?.ndjson_file_path?.replace(/\.ndjson$/, ""));
		let folder_path = NDJSON.getCacheDirectory(file_path);
		let newline = Buffer.from("\n");
		let pool = NDJSON.getWorkerPool();
		let tmp_path = `${target_path}.tmp_${Date.now()}`;
		
		let writeBuf = async function (arg0_ws, arg1_buf) {
			if (!arg0_ws.write(arg1_buf))
				await new Promise((resolve) => arg0_ws.once("drain", resolve));
		};
		
		//Guard clauses
		if (!fs.existsSync(folder_path)) return target_path;
		
		//1. Flush any pending worker in-memory edits to their partition shards
		await NDJSON.task("all", {
			file_path: file_path,
			type: "flush_dirty"
		});
		
		let ws = fs.createWriteStream(tmp_path, { highWaterMark: 1024 * 1024 });
		await writeBuf(ws, Buffer.from("{\n"));
		
		//2. Write metadata if extant
		let metadata_path = path.join(folder_path, "metadata.json");
		if (fs.existsSync(metadata_path)) {
			let meta_content = fs.readFileSync(metadata_path, "utf8").trim();
			if (meta_content.length > 0)
				await writeBuf(ws, Buffer.from(`"map_settings":${meta_content},\n`));
		}
		
		//3. Stream partition shards via native buffer chunk parsing (zero string allocations)
		for (let i = 0; i < pool.length; i++) {
			let is_last = (i === pool.length - 1);
			let page_file = path.join(folder_path, `partition_${i}.ndjson`);
			if (!fs.existsSync(page_file)) {
				let legacy_file = path.join(folder_path, `${i}.ndjson`);
				if (fs.existsSync(legacy_file)) page_file = legacy_file;
			}
			
			if (fs.existsSync(page_file)) {
				let leftover = Buffer.alloc(0);
				let pending_line = null;
				let rs = fs.createReadStream(page_file, { highWaterMark: 1024 * 1024 });
				
				for await (let chunk of rs) {
					let start = 0;
					for (let x = 0; x < chunk.length; x++) {
						if (chunk[x] === 10) { // '\n'
							let line_buf = chunk.subarray(start, x);
							if (leftover.length > 0) {
								line_buf = Buffer.concat([leftover, line_buf]);
								leftover = Buffer.alloc(0);
							}
							if (line_buf.length > 0 && line_buf[line_buf.length - 1] === 13)
								line_buf = line_buf.subarray(0, line_buf.length - 1);
							if (line_buf.length > 0) {
								if (!is_last) {
									await writeBuf(ws, line_buf);
									await writeBuf(ws, comma_newline);
								} else {
									if (pending_line !== null) {
										await writeBuf(ws, pending_line);
										await writeBuf(ws, comma_newline);
									}
									pending_line = Buffer.from(line_buf);
								}
							}
							start = x + 1;
						}
					}
					if (start < chunk.length) {
						let rem = chunk.subarray(start);
						leftover = (leftover.length > 0) ? Buffer.concat([leftover, rem]) : Buffer.from(rem);
					}
				}
				
				if (leftover.length > 0) {
					if (leftover[leftover.length - 1] === 13)
						leftover = leftover.subarray(0, leftover.length - 1);
					if (leftover.length > 0) {
						if (!is_last) {
							await writeBuf(ws, leftover);
							await writeBuf(ws, comma_newline);
						} else {
							if (pending_line !== null) {
								await writeBuf(ws, pending_line);
								await writeBuf(ws, comma_newline);
							}
							pending_line = Buffer.from(leftover);
						}
					}
				}
				
				if (is_last && pending_line !== null) {
					await writeBuf(ws, pending_line);
					await writeBuf(ws, newline);
				}
			}
		}
		
		await writeBuf(ws, Buffer.from("}"));
		ws.end();
		await new Promise((resolve) => ws.on("finish", resolve));
		
		//4. Verify boundary JSON structure before replacement
		let stat = fs.statSync(tmp_path);
		let fd = fs.openSync(tmp_path, "r");
		let head_buf = Buffer.alloc(50);
		let tail_buf = Buffer.alloc(50);
		fs.readSync(fd, head_buf, 0, 50, 0);
		fs.readSync(fd, tail_buf, 0, 50, Math.max(0, stat.size - 50));
		fs.closeSync(fd);
		
		let head_str = head_buf.toString("utf8");
		let tail_str = tail_buf.toString("utf8");
		if (!head_str.startsWith("{\n") || !tail_str.trim().endsWith("}")) {
			try { fs.unlinkSync(tmp_path); } catch (e) {}
			throw new Error(`[NDJSON.save] Invalid JSON structure compiled to ${tmp_path}`);
		}
		
		//5. Atomic replacement with backup
		if (fs.existsSync(target_path)) {
			try { fs.copyFileSync(target_path, bak_path); } catch (e) {}
		}
		
		fs.copyFileSync(tmp_path, target_path);
		try { fs.unlinkSync(tmp_path); } catch (e) {}
		
		//Return statement
		return target_path;
	};
	
	/**
	 * Sets the `.history.keyframes` object for a given key.
	 *
	 * @param {string} arg0_id
	 * @param {Object} arg1_keyframes
	 *
	 * @returns {Promise<boolean>}
	 */
	/**
	 * Sets a single keyframe for a specific entity ID in its partition worker.
	 *
	 * @param {string} arg0_id
	 * @param {number|Object|string} arg1_date
	 * @param {Object} arg2_keyframe
	 *
	 * @returns {Promise<boolean>}
	 */
	NDJSON.setKeyframe = async function (arg0_id, arg1_date, arg2_keyframe) {
		//Convert from parameters
		let id = arg0_id;
		let date = arg1_date;
		let keyframe = arg2_keyframe;
		let file_path = NDJSON.getFilePath();
		if (!file_path) return false;
		
		//Return statement
		return NDJSON.task(id, {
			type: "set_keyframe",
			file_path: file_path,
			id: id,
			date: date,
			keyframe: keyframe
		});
	};
	
	/**
	 * Sets multiple modified keyframes differentially for an entity ID in its partition worker.
	 *
	 * @param {string} arg0_id
	 * @param {Object} arg1_diff
	 *
	 * @returns {Promise<boolean>}
	 */
	NDJSON.setKeyframesDiff = async function (arg0_id, arg1_diff) {
		//Convert from parameters
		let id = arg0_id;
		let diff = arg1_diff;
		let file_path = NDJSON.getFilePath();
		if (!file_path) return false;
		
		//Return statement
		return NDJSON.task(id, {
			type: "set_keyframes_diff",
			file_path: file_path,
			id: id,
			diff: diff
		});
	};
	
	NDJSON.setKeyframes = async function (arg0_id, arg1_keyframes) {
		//Convert from parameters
		let id = arg0_id;
		let keyframes_obj = arg1_keyframes;
		let file_path = NDJSON.getFilePath();
		if (!file_path) return false;
		
		//Return statement
		return NDJSON.task(id, {
			type: "set_keyframes",
			file_path: file_path,
			id: id,
			keyframes: keyframes_obj
		});
	};
	
	/**
	 * Sets a key-value pair in the NDJSON file.
	 *
	 * @param {string} arg0_id
	 * @param {Object} arg1_value
	 *
	 * @returns {Promise<boolean>}
	 */
	NDJSON.setValue = async function (arg0_id, arg1_value) {
		//Convert from parameters
		let id = arg0_id;
		let value = arg1_value;
		
		//Declare local instance variables
		let map = {};
		map[id] = value;
		
		//Return statement
		return await NDJSON.setValues(map);
	};
	
	/**
	 * Sets multiple key-value pairs for the NDJSON file.
	 *
	 * @param {Object} arg0_update_map
	 *
	 * @returns {Promise<boolean>}
	 */
	NDJSON.setValues = async function (arg0_update_map) {
		//Convert from parameters
		let update_map = (arg0_update_map) ? arg0_update_map : {};
		
		//Declare local instance variables
		let pool = NDJSON.getWorkerPool();
		let updates_by_worker = {};
		
		//Iterate over all keys in update map
		for (let key in update_map) {
			let wid = NDJSON.getWorkerID(key, pool.length);
			if (!updates_by_worker[wid]) updates_by_worker[wid] = {};
			updates_by_worker[wid][key] = update_map[key];
		}
		
		let target_wids = Object.keys(updates_by_worker).map(Number);
		let file_path = NDJSON.getFilePath();
		if (!file_path) return false;
		
		//Dispatch tasks via the NDJSON.task helper
		await NDJSON.task(target_wids, (wid) => ({
			type: "set_values",
			file_path: file_path,
			update_map: updates_by_worker[wid]
		}));
		
		//Return statement
		return true;
	};
}