//[VERCENGEN]

//Import libraries
let fs = require("node:fs");
let path = require("node:path");
let readline = require("node:readline");
let { parentPort, workerData } = require("node:worker_threads");

if (!global?.NDJSON) global.NDJSON = {};
if (!global.ve) global.ve = {};

require("../db_shared/NDJSON_history.js");

//Declare variables
let current_file_path = null;
let dirty_keys = new Set();
let partition_cache = new Map();
let processing = false;
let queue = [];

//Internal helper functions
{
	/**
	 * Returns the cache partition directory in saves/.cache.
	 *
	 * @param {string} [arg0_file_path]
	 *
	 * @returns {string}
	 */
	NDJSON.getCacheDirectory = function (arg0_file_path) {
		let file_path = (arg0_file_path) ? arg0_file_path : "";
		let base_name = (file_path) ? path.basename(file_path, path.extname(file_path)) : "current";
		return path.resolve(process.cwd(), "saves/.cache", base_name);
	};
	NDJSON.getTempDirectory = NDJSON.getCacheDirectory;
	
	Object.getValue = function (arg0_object, arg1_variable_string) {
		//Convert from parameters
		let object = arg0_object;
		let variable_string = (arg1_variable_string) ? arg1_variable_string : "";
		
		//Return statement
		return variable_string.split(".")
			.reduce((local_object, local_key) => local_object?.[local_key], object);
	};
}

let updateBBoxFromCoords = function (obj, bbox) {
	if (!obj) return;
	
	if (Array.isArray(obj)) {
		if (obj.length >= 2 && typeof obj[0] === "number" && typeof obj[1] === "number") {
			let x = obj[0];
			let y = obj[1];
			if (x < bbox[0]) bbox[0] = x;
			if (y < bbox[1]) bbox[1] = y;
			if (x > bbox[2]) bbox[2] = x;
			if (y > bbox[3]) bbox[3] = y;
			bbox[4] = true;
		} else {
			for (let i = 0; i < obj.length; i++) updateBBoxFromCoords(obj[i], bbox);
		}
	} else if (typeof obj === "object") {
		if (obj.coordinates) {
			updateBBoxFromCoords(obj.coordinates, bbox);
		} else if (obj.geometry) {
			updateBBoxFromCoords(obj.geometry, bbox);
		} else if (obj.feature) {
			updateBBoxFromCoords(obj.feature, bbox);
		}
	}
};

let calculateBBox = function (raw_keyframes, entity) {
	//Declare local instance variables: [min_x, min_y, max_x, max_y, found_any]
	let bbox = [Infinity, Infinity, -Infinity, -Infinity, false];
	
	if (raw_keyframes && typeof raw_keyframes === "object") {
		let ts = History.getTimestamps(raw_keyframes);
		for (let i = 0; i < ts.length; i++) {
			let kf = raw_keyframes[ts[i]];
			updateBBoxFromCoords(kf, bbox);
			if (bbox[4]) break;
		}
	}
	
	if (!bbox[4] && entity?.value) {
		updateBBoxFromCoords(entity.value, bbox);
	}
	
	//Return statement
	return bbox[4] ? [bbox[0], bbox[1], bbox[2], bbox[3]] : null;
};

let resolveHistory = function (data, timestamp, options) {
	if (!data) return null;
	
	let history_obj = typeof data.history === "string" ? JSON.parse(data.history) : data.history;
	if (!history_obj) return null;
	
	let raw_keyframes = (history_obj && history_obj.keyframes) ? history_obj.keyframes : history_obj;
	
	if (typeof raw_keyframes === "object" && raw_keyframes !== null) {
		if (options?.type === "get_keyframes")
			return History.getKeyframes(raw_keyframes);
		return History.getKeyframe(raw_keyframes, timestamp);
	}
	
	//Return statement
	return null;
};

let loadPartition = async function (page_file) {
	partition_cache.clear();
	dirty_keys.clear();
	
	if (!fs.existsSync(page_file)) return;
	
	let rs = fs.createReadStream(page_file, { highWaterMark: 1024 * 1024 });
	let rl = readline.createInterface({ input: rs });
	
	try {
		for await (let line of rl) {
			let clean = line.trim();
			if (clean.length === 0) continue;
			if (clean.charCodeAt(0) !== 34) continue;
			
			let quote_end = clean.indexOf('"', 1);
			if (quote_end <= 1) continue;
			let colon_idx = clean.indexOf(':', quote_end);
			if (colon_idx === -1) continue;
			
			let key = clean.slice(1, quote_end);
			let val_str = clean.slice(colon_idx + 1).trim();
			if (val_str.endsWith(",")) val_str = val_str.slice(0, -1);
			
			try {
				let entity = JSON.parse(val_str);
				let history_obj = typeof entity.history === "string" ? JSON.parse(entity.history) : entity.history;
				if (typeof entity.history === "string")
					entity.history = history_obj;
				let raw_keyframes = (history_obj && history_obj.keyframes) ? history_obj.keyframes : history_obj;
				let timestamps = (raw_keyframes && typeof raw_keyframes === "object") ? History.getTimestamps(raw_keyframes) : [];
				let bbox = calculateBBox(raw_keyframes, entity);
				
				partition_cache.set(key, {
					bbox: bbox,
					class_name: entity.class_name,
					entity: entity,
					id: key,
					metadata: entity.metadata,
					timestamps: timestamps,
					type: entity.type,
					value: entity.value
				});
			} catch (e) {}
		}
	} finally {
		rl.close();
		rs.destroy();
		if (global.gc) {
			try { global.gc(); } catch (e) {}
		}
	}
};

let safeWrite = async function (ws, rs, content) {
	let can_write = ws.write(content);
	if (!can_write) {
		if (rs && typeof rs.pause === "function") rs.pause();
		await new Promise((resolve) => ws.once("drain", resolve));
		if (rs && typeof rs.resume === "function") rs.resume();
	}
};

let updateNDJSON = async function (page_file, getUpdatedValue, options) {
	let tmp_file = `${page_file}.tmp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
	let updated = false;
	
	let dir = path.dirname(page_file);
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
	
	let ws = fs.createWriteStream(tmp_file, { highWaterMark: 1024 * 1024 });
	let target_id = (options?.target_id !== undefined && options?.target_id !== null) ? String(options.target_id) : null;
	let target_keys = options?.target_keys || null;
	
	try {
		if (fs.existsSync(page_file)) {
			let rs = fs.createReadStream(page_file, { highWaterMark: 1024 * 1024 });
			let rl = readline.createInterface({ input: rs, crlfDelay: Infinity });
			
			try {
				for await (let line of rl) {
					let clean = line.trim();
					if (clean.length === 0) continue;
					
					let key = null;
					let colon_idx = -1;
					if (clean.charCodeAt(0) === 34) {
						let quote_end = clean.indexOf('"', 1);
						if (quote_end > 1) {
							colon_idx = clean.indexOf(':', quote_end);
							if (colon_idx > quote_end)
								key = clean.slice(1, quote_end);
						}
					}
					
					if (key !== null) {
						if (target_id !== null && key !== target_id) {
							await safeWrite(ws, rs, clean);
							await safeWrite(ws, rs, "\n");
							if (clean.length > 5 * 1024 * 1024 && global.gc)
								try { global.gc(); } catch (e) {}
							continue;
						}
						if (target_keys !== null && !target_keys.has(key)) {
							await safeWrite(ws, rs, clean);
							await safeWrite(ws, rs, "\n");
							if (clean.length > 5 * 1024 * 1024 && global.gc)
								try { global.gc(); } catch (e) {}
							continue;
						}
						
						let val_str = clean.slice(colon_idx + 1).trim();
						if (val_str.endsWith(",")) val_str = val_str.slice(0, -1);
						
						let newValue = getUpdatedValue(key, val_str);
						if (newValue !== undefined) {
							if (newValue !== null) {
								await safeWrite(ws, rs, `"${key}":`);
								await safeWrite(ws, rs, JSON.stringify(newValue));
								await safeWrite(ws, rs, "\n");
							}
							updated = true;
						} else {
							await safeWrite(ws, rs, clean);
							await safeWrite(ws, rs, "\n");
						}
					} else {
						await safeWrite(ws, rs, clean);
						await safeWrite(ws, rs, "\n");
					}

					if (clean.length > 5 * 1024 * 1024 && global.gc)
						try { global.gc(); } catch (e) {}
				}
			} finally {
				rl.close();
				rs.destroy();
			}
		}
		
		let extra_appends = getUpdatedValue(null, null, updated);
		if (extra_appends) {
			for (let [k, val] of Object.entries(extra_appends)) {
				if (val !== null)
					await safeWrite(ws, null, `"${k}":${JSON.stringify(val)}\n`);
			}
		}
		
		ws.end();
		await new Promise((resolve) => ws.on("finish", resolve));
		
		let attempts = 0;
		let renamed = false;
		while (!renamed && attempts < 10) {
			try {
				fs.renameSync(tmp_file, page_file);
				renamed = true;
			} catch (e) {
				attempts++;
				if (attempts >= 10) throw e;
				await new Promise((resolve) => setTimeout(resolve, 50));
			}
		}
	} catch (err) {
		try { ws.destroy(); } catch (e) {}
		if (fs.existsSync(tmp_file)) {
			try { fs.unlinkSync(tmp_file); } catch (e) {}
		}
		throw err;
	}
};

parentPort.on("message", (task) => {
	if (task.type === "get_diagnostics") {
		let memory = process.memoryUsage();
		let v8_stats = require("node:v8").getHeapStatistics();
		
		try {
			return parentPort.postMessage({
				results: {
					cached_entities: partition_cache.size,
					heapLimit: v8_stats.heap_size_limit,
					heapTotal: memory.heapTotal,
					heapUsed: memory.heapUsed,
					percentage: parseFloat(((memory.heapUsed / v8_stats.heap_size_limit) * 100).toFixed(2)),
					rss: memory.rss,
					worker_id: workerData.worker_id
				},
				task_id: task.task_id
			});
		} catch (e) {
			return;
		}
	}
	
	queue.push(task);
	if (!processing) processQueue();
});

async function handleTask (arg0_task) {
	//Convert from parameters
	let task = arg0_task;
	
	//Declare local instance variables
	let {
		bbox,
		date,
		diff,
		file_path,
		id,
		keyframe,
		keyframes,
		limit_end,
		query,
		task_id,
		timestamp,
		type,
		update_map,
		zoom
	} = task;
	
	let base_path = file_path ? file_path.replace(/\.ndjson$/, "") : "";
	let folder_path = (NDJSON.getCacheDirectory) ?
		NDJSON.getCacheDirectory(base_path) :
		NDJSON.getTempDirectory(base_path);
	let page_file = path.join(folder_path, `partition_${workerData.worker_id}.ndjson`);
	if (!fs.existsSync(page_file)) {
		let legacy_file = path.join(folder_path, `${workerData.worker_id}.ndjson`);
		if (fs.existsSync(legacy_file)) {
			page_file = legacy_file;
		} else {
			let legacy_temp_dir = path.resolve(process.cwd(), "saves/.temp", path.basename(base_path, path.extname(base_path)));
			let legacy_temp_file = path.join(legacy_temp_dir, `partition_${workerData.worker_id}.ndjson`);
			if (fs.existsSync(legacy_temp_file))
				page_file = legacy_temp_file;
		}
	}
	
	//Ensure partition loaded in memory
	if (type === "init_partition" || current_file_path !== base_path || partition_cache.size === 0) {
		await loadPartition(page_file);
		current_file_path = base_path;
		if (type === "init_partition")
			return parentPort.postMessage({ results: true, task_id });
	}
	
	if (type === "diff") {
		let cached = partition_cache.get(id);
		let found = null;
		
		if (cached) {
			let state_val = resolveHistory(cached.entity, timestamp);
			found = {
				class_name: cached.class_name,
				id: id,
				key: id,
				value: (state_val !== null) ? state_val : cached.value
			};
		}
		
		return parentPort.postMessage({ results: found, task_id });
	}
	
	if (type === "diff_all") {
		let list = [];
		
		for (let [key, cached] of partition_cache) {
			let state_val = resolveHistory(cached.entity, timestamp);
			if (state_val !== null && state_val !== undefined) {
				list.push({
					class_name: cached.class_name,
					id: key,
					key: key,
					value: state_val
				});
			} else {
				list.push({
					class_name: cached.class_name,
					id: key,
					key: key,
					value: cached.value
				});
			}
		}
		
		return parentPort.postMessage({ results: list, task_id });
	}
	
	if (type === "diff_bbox") {
		let list = [];
		let has_bbox = (Array.isArray(bbox) && bbox.length >= 4);
		let q_min_x, q_min_y, q_max_x, q_max_y;
		
		if (has_bbox) {
			q_min_x = bbox[0];
			q_min_y = bbox[1];
			q_max_x = bbox[2];
			q_max_y = bbox[3];
		}
		
		for (let [key, cached] of partition_cache) {
			if (has_bbox && cached.bbox) {
				let e_min_x = cached.bbox[0];
				let e_min_y = cached.bbox[1];
				let e_max_x = cached.bbox[2];
				let e_max_y = cached.bbox[3];
				
				if (e_max_x < q_min_x || e_min_x > q_max_x || e_max_y < q_min_y || e_min_y > q_max_y) {
					continue;
				}
			}
			
			let has_history = (cached.timestamps && cached.timestamps.length > 0);
			let resolved_value;
			
			if (has_history) {
				if (!cached.timestamps.some(ts => timestamp >= ts))
					continue;
				
				let state_val = resolveHistory(cached.entity, timestamp);
				if (!state_val || state_val[0] === null || state_val[0] === undefined || state_val[0] === "undefined" || state_val[0] === "null" || state_val[0] === "")
					continue;
				
				resolved_value = state_val;
			} else {
				resolved_value = cached.value;
			}
			
			if (resolved_value && resolved_value[0] !== null && resolved_value[0] !== undefined && resolved_value[0] !== "undefined" && resolved_value[0] !== "null" && resolved_value[0] !== "") {
				list.push({
					class_name: cached.class_name,
					id: key,
					key: key,
					value: resolved_value
				});
			}
		}
		
		return parentPort.postMessage({ results: list, task_id });
	}
	
	if (type === "get_diffs") {
		let found = {};
		let target_ids = Array.isArray(task.ids) ? task.ids : [];
		
		for (let i = 0; i < target_ids.length; i++) {
			let tid = target_ids[i];
			let cached = partition_cache.get(tid);
			if (cached) {
				let state_val = resolveHistory(cached.entity, timestamp);
				found[tid] = {
					class_name: cached.class_name,
					key: tid,
					value: (state_val !== null) ? state_val : cached.value
				};
			}
		}
		
		return parentPort.postMessage({ results: found, task_id });
	}
	
	if (type === "get_hierarchy_values") {
		let list = [];
		
		for (let [key, cached] of partition_cache) {
			let entity_obj = cached.entity;
			let is_feature = (cached.type === "feature" || cached.class_name?.startsWith("Feature"));
			let resolved_name;
			
			if (!is_feature) {
				let state_val = resolveHistory(entity_obj, timestamp);
				if (state_val?.[2]?.name) {
					resolved_name = state_val[2].name;
				} else {
					let history_obj = typeof entity_obj?.history === "string" ?
						JSON.parse(entity_obj.history) : entity_obj?.history;
					let raw_keyframes = (history_obj && history_obj.keyframes) ?
						history_obj.keyframes : history_obj;
					if (raw_keyframes && typeof raw_keyframes === "object")
						resolved_name = History.getName(raw_keyframes);
				}
			}
			
			let name = entity_obj?.metadata?.name || entity_obj?.name || resolved_name || entity_obj?.id || key;
			
			list.push({
				class_name: cached.class_name,
				key: key,
				metadata: entity_obj?.metadata,
				name: name,
				type: cached.type,
				value: is_feature ? (typeof entity_obj?.value === "string" ? JSON.parse(entity_obj.value) : entity_obj?.value) : undefined
			});
		}
		
		return parentPort.postMessage({ results: list, task_id });
	}
	
	if (type === "get_keyframes") {
		let cached = partition_cache.get(id);
		let found = null;
		
		if (cached) {
			let state_val = resolveHistory(cached.entity, undefined, { type: "get_keyframes" });
			if (state_val !== null) found = { key: id, value: state_val };
		}
		
		return parentPort.postMessage({ results: found, task_id });
	}
	
	if (type === "get_timestamps") {
		let ts_set = new Set();
		for (let [key, cached] of partition_cache) {
			if (cached.timestamps && Array.isArray(cached.timestamps)) {
				for (let i = 0; i < cached.timestamps.length; i++) {
					ts_set.add(cached.timestamps[i]);
				}
			}
		}
		return parentPort.postMessage({ results: Array.from(ts_set), task_id });
	}
	
	if (type === "get_value") {
		let cached = partition_cache.get(id);
		return parentPort.postMessage({ results: cached ? cached.entity : null, task_id });
	}
	
	if (type === "get_values") {
		let found = {};
		let target_ids = Array.isArray(task.ids) ? task.ids : [];
		
		for (let i = 0; i < target_ids.length; i++) {
			let tid = target_ids[i];
			let cached = partition_cache.get(tid);
			if (cached) found[tid] = cached.entity;
		}
		
		return parentPort.postMessage({ results: found, task_id });
	}
	
	if (type === "query") {
		let list = [];
		
		for (let [key, cached] of partition_cache) {
			if (limit_end !== undefined && list.length >= limit_end) break;
			
			let obj = cached.entity;
			let matches = true;
			
			for (let query_key in query) {
				if (Object.getValue(obj, query_key) !== query[query_key]) {
					matches = false;
					break;
				}
			}
			
			if (matches) {
				let result_obj = structuredClone(obj);
				result_obj._id = key;
				list.push(result_obj);
			}
		}
		
		return parentPort.postMessage({ results: list, task_id });
	}
	
	if (type === "flush_dirty") {
		if (dirty_keys.size > 0) {
			let target_keys = new Set(dirty_keys);
			await updateNDJSON(page_file, (key, val_str) => {
				let cached = partition_cache.get(key);
				if (cached?.entity) return cached.entity;
				return undefined;
			}, { target_keys: target_keys });
			dirty_keys.clear();
		}
		
		return parentPort.postMessage({ results: true, task_id });
	}
	
	if (type === "set_keyframe") {
		let cached = partition_cache.get(id);
		let ts_key = typeof date === "object" ? Date.getTimestamp(date) : date;
		ts_key = String(ts_key);
		
		if (cached) {
			let history_obj = typeof cached.entity.history === "string" ? JSON.parse(cached.entity.history) : cached.entity.history;
			if (!history_obj) history_obj = {};
			if (!history_obj.keyframes) history_obj.keyframes = {};
			
			history_obj.keyframes[ts_key] = keyframe;
			cached.entity.history = history_obj;
			
			let ts_num = Number(ts_key);
			if (!cached.timestamps.includes(ts_num)) {
				cached.timestamps.push(ts_num);
				cached.timestamps.sort((a, b) => a - b);
			}
			if (cached.bbox) {
				updateBBoxFromCoords(keyframe, cached.bbox);
			} else {
				cached.bbox = calculateBBox(history_obj.keyframes, cached.entity);
			}
		}
		dirty_keys.add(id);
		return parentPort.postMessage({ results: true, task_id });
	}
	
	if (type === "set_keyframes_diff") {
		let cached = partition_cache.get(id);
		if (cached && diff && typeof diff === "object") {
			let history_obj = typeof cached.entity.history === "string" ? JSON.parse(cached.entity.history) : cached.entity.history;
			if (!history_obj) history_obj = {};
			if (!history_obj.keyframes) history_obj.keyframes = {};
			
			for (let ts in diff) {
				let ts_key = String(ts);
				history_obj.keyframes[ts_key] = diff[ts];
				let ts_num = Number(ts_key);
				if (!cached.timestamps.includes(ts_num)) cached.timestamps.push(ts_num);
				if (cached.bbox) updateBBoxFromCoords(diff[ts], cached.bbox);
			}
			cached.timestamps.sort((a, b) => a - b);
			cached.entity.history = history_obj;
		}
		dirty_keys.add(id);
		return parentPort.postMessage({ results: true, task_id });
	}
	
	if (type === "set_keyframes") {
		let cached = partition_cache.get(id);
		if (cached) {
			let history_obj = typeof cached.entity.history === "string" ? JSON.parse(cached.entity.history) : cached.entity.history;
			if (!history_obj) history_obj = {};
			history_obj.keyframes = keyframes;
			cached.entity.history = history_obj;
			cached.timestamps = History.getTimestamps(keyframes);
			cached.bbox = calculateBBox(keyframes, cached.entity);
		} else {
			let history_obj = { keyframes: keyframes };
			let timestamps = History.getTimestamps(keyframes);
			let bbox = calculateBBox(keyframes, null);
			partition_cache.set(id, {
				bbox: bbox,
				class_name: "Geometry",
				entity: { history: history_obj, id: id },
				id: id,
				metadata: {},
				timestamps: timestamps,
				type: "geometry",
				value: undefined
			});
		}
		dirty_keys.add(id);
		
		return parentPort.postMessage({ results: true, task_id });
	}
	
	if (type === "set_values") {
		for (let k in update_map) {
			let val = update_map[k];
			if (val === null) {
				partition_cache.delete(k);
			} else {
				let history_obj = typeof val.history === "string" ? JSON.parse(val.history) : val.history;
				let raw_keyframes = (history_obj && history_obj.keyframes) ? history_obj.keyframes : history_obj;
				let timestamps = (raw_keyframes && typeof raw_keyframes === "object") ? History.getTimestamps(raw_keyframes) : [];
				let bbox = calculateBBox(raw_keyframes, val);
				
				partition_cache.set(k, {
					bbox: bbox,
					class_name: val.class_name,
					entity: val,
					id: k,
					metadata: val.metadata,
					timestamps: timestamps,
					type: val.type,
					value: val.value
				});
			}
		}
		
		let updated_keys = new Set();
		let target_keys = new Set(Object.keys(update_map));
		if (dirty_keys.size > 0) {
			for (let dk of dirty_keys) {
				if (!target_keys.has(dk)) {
					target_keys.add(dk);
					let cached = partition_cache.get(dk);
					if (cached?.entity) update_map[dk] = cached.entity;
				}
			}
			dirty_keys.clear();
		}
		
		await updateNDJSON(page_file, (key, val_str) => {
			if (key === null) {
				let rem = {};
				for (let k in update_map)
					if (!updated_keys.has(k)) rem[k] = update_map[k];
				return rem;
			}
			if (update_map.hasOwnProperty(key)) {
				updated_keys.add(key);
				return update_map[key];
			}
			return undefined;
		}, { target_keys: target_keys });
		
		return parentPort.postMessage({ results: true, task_id });
	}
	
	//Fallback for unhandled task types
	return parentPort.postMessage({ results: null, task_id });
}

async function processQueue () {
	processing = true;
	while (queue.length > 0) {
		let task = queue.shift();
		try {
			await handleTask(task);
		} catch (err) {
			console.error(`[NDJSON Worker ${workerData?.worker_id}] Error handling task ${task?.type}:`, err);
			try {
				parentPort.postMessage({ error: err.message, results: null, task_id: task?.task_id });
			} catch (e) {}
		}
	}
	processing = false;
}