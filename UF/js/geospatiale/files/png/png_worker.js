//Guard clause: Ensure worker thread scripts never execute directly within the renderer DOM thread
if (typeof window !== "undefined" && typeof document !== "undefined") {
  return;
}

let fs = require("fs");
let path = require("path");

let parentPort = null;
let workerData = null;

try {
  let worker_threads = require("worker_threads");
  parentPort = worker_threads.parentPort;
  workerData = worker_threads.workerData;
} catch (e) {}

let is_child_process = (!parentPort && typeof process !== "undefined" && typeof process.send === "function");
let message_port = (parentPort) ? parentPort : ((is_child_process) ? {
  on: (event, callback) => process.on(event, callback),
  postMessage: (data) => process.send(data)
} : null);

let worker_id = (workerData && workerData.worker_id !== undefined) ?
  workerData.worker_id : (process.env.WORKER_ID ? parseInt(process.env.WORKER_ID) : 0);

//Safeguard require against AMD loader pollution in worker
{
  let Module = require("module");
  let original_require = Module.prototype.require;

  Module.prototype.require = function () {
    let saved_amd;
    let saved_define;

    if (typeof global.define !== "undefined" && global.define && global.define.amd) {
      saved_amd = global.define.amd;
      saved_define = global.define;
      try { delete global.define.amd; } catch (e) {}
      global.define = undefined;
    }

    try {
      return original_require.apply(this, arguments);
    } finally {
      if (saved_define !== undefined) {
        global.define = saved_define;
        if (saved_amd !== undefined) global.define.amd = saved_amd;
      }
    }
  };
}

//Bootstrap worker global environment
global.fs = fs;
global.path = path;
global.pngjs = require("pngjs");

try { global.JSON5 = require("json5"); } catch (e) {}
try { global.mathjs = require("mathjs"); } catch (e) {}
try { global.ml_matrix = require("ml-matrix"); } catch (e) {}
try { global.cubic_spline = require("cubic-spline"); } catch (e) {}

//Load core UF dependencies
let root_dir = (workerData && workerData.root_dir) ?
  workerData.root_dir :
  (fs.existsSync(path.join(process.cwd(), "package.json")) ? process.cwd() : path.resolve(__dirname, "../../../../../"));

let loadDirectory = function (rel_dir) {
  let full_dir = path.join(root_dir, rel_dir);
  if (fs.existsSync(full_dir)) {
    let files = fs.readdirSync(full_dir).filter(f => f.endsWith(".js") && !f.includes("worker"));
    for (let i = 0; i < files.length; i++) {
      try {
        require(path.join(full_dir, files[i]));
      } catch (e) {
        console.error(`[GeoWorker ${worker_id}] Failed to require ${path.join(rel_dir, files[i])}:`, e);
      }
    }
  }
};

loadDirectory("UF/js/number");
loadDirectory("UF/js/string");
loadDirectory("UF/js/colour");
loadDirectory("UF/js/file");
loadDirectory("UF/js/object");
loadDirectory("UF/js/array");
loadDirectory("UF/js/blacktraffic");
loadDirectory("UF/js/statistics");
loadDirectory("UF/js/geospatiale/coords");
loadDirectory("UF/js/geospatiale/operations");
loadDirectory("UF/js/geospatiale/files");
loadDirectory("UF/js/geospatiale/files/png");

//Define Histmap paths on global for stage modules
global.h1 = path.join(root_dir, "histmap/1.data_raw/");
global.h2 = path.join(root_dir, "histmap/2.data_cleaning/");
global.h3 = path.join(root_dir, "histmap/3.data_transform/");
global.h4 = path.join(root_dir, "histmap/4.data_exports/");
global.h5 = path.join(root_dir, "histmap/5.data_visualisation/");

let safeRequire = function (rel_path) {
  let full_path = path.join(root_dir, rel_path);
  if (fs.existsSync(full_path)) {
    try {
      require(full_path);
    } catch (err) {
      console.error(`[GeoWorker ${worker_id}] Failed to require ${rel_path}:`, err);
    }
  }
};

//Load common histmap pipeline modules
safeRequire("histmap/2.data_cleaning/metadata_HYDE/metadata_HYDE.js");
safeRequire("histmap/2.data_cleaning/landuse_HYDE/landuse_HYDE.js");
safeRequire("histmap/2.data_cleaning/population_Global/population_Global.js");
safeRequire("histmap/2.data_cleaning/population_Stadester/stadester_rasters.js");
safeRequire("histmap/2.data_cleaning/population_Stadester/stadester_uud.js");
safeRequire("histmap/2.data_cleaning/admin_modern/admin_modern.js");
safeRequire("histmap/2.data_cleaning/professions_Bairoch/professions_Bairoch.js");
safeRequire("histmap/3.data_transform/professions/professions.js");

//Load modular task definitions from ./tasks/
let loadTasks = function () {
  let tasks_dir = path.join(__dirname, "tasks");
  if (fs.existsSync(tasks_dir)) {
    let files = fs.readdirSync(tasks_dir).filter(f => f.endsWith(".js"));
    for (let i = 0; i < files.length; i++) {
      try {
        require(path.join(tasks_dir, files[i]));
      } catch (err) {
        console.error(`[GeoWorker ${worker_id}] Failed to load task module ${files[i]}:`, err);
      }
    }
  }
};

loadTasks();

//Task execution router
let handleTask = async function (task) {
  let task_type = task.type || task.task_type;
  let handler = GeoPNG.tasks?.[task_type];

  if (typeof handler === "function") {
    return await handler(task);
  }

  throw new Error(`Unknown GeoWorker task type: ${task_type}`);
};

//Message receiver
if (message_port) {
  message_port.on("message", async (task) => {
    if (!task) return;

    //Abort request
    if (task.type === "abort") {
      process.exit(0);
    }

    let task_id = task.task_id;
    try {
      let result = await handleTask(task);
      message_port.postMessage({
        result: result,
        success: true,
        task_id: task_id
      });
    } catch (err) {
      message_port.postMessage({
        error: err.message || String(err),
        stack: err.stack,
        success: false,
        task_id: task_id
      });
    }
  });

  //Ensure safe exit if parent port closes or process disconnects
  if (parentPort) {
    parentPort.on("close", () => {
      process.exit(0);
    });
  } else if (typeof process !== "undefined" && process.on) {
    process.on("disconnect", () => {
      process.exit(0);
    });
  }
}
