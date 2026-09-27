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
safeRequire("histmap/2.data_cleaning/population_Stadester/stadester_rasters.js");
safeRequire("histmap/2.data_cleaning/population_Stadester/stadester_uud.js");
safeRequire("histmap/2.data_cleaning/metadata_HYDE/metadata_HYDE.js");

//Task execution handlers
let handleTask = async function (task) {
  let task_type = task.type || task.task_type;

  //1. Ping healthcheck
  if (task_type === "ping") {
    return { pong: true, worker_id: worker_id };
  }

  //1b. Copy file
  if (task_type === "copy") {
    let from_file = task.from_file_path || task.source_path;
    let out_file = task.output_file_path || task.dest_path;
    let out_dir = path.dirname(out_file);
    if (!fs.existsSync(out_dir)) fs.mkdirSync(out_dir, { recursive: true });
    fs.copyFileSync(from_file, out_file);
    return out_file;
  }

  //1c. Composite overlay (overlays top raster where top > 0 onto base raster)
  if (task_type === "composite_overlay") {
    let base_file = task.base_file_path;
    let out_file = task.output_file_path || task.dest_path;
    let top_file = task.top_file_path;
    let out_dir = path.dirname(out_file);
    if (!fs.existsSync(out_dir)) fs.mkdirSync(out_dir, { recursive: true });

    if (!fs.existsSync(top_file)) {
      if (fs.existsSync(base_file)) fs.copyFileSync(base_file, out_file);
      return out_file;
    }
    if (!fs.existsSync(base_file)) {
      fs.copyFileSync(top_file, out_file);
      return out_file;
    }

    let base_raster = await GeoPNG.loadNumberRasterImageAsync(base_file, { format: "float32" });
    let top_raster = await GeoPNG.loadNumberRasterImageAsync(top_file, { format: "float32" });
    let out_data = new Float32Array(base_raster.data.length);

    for (let i = 0; i < out_data.length; i++) {
      let top_val = top_raster.data[i];
      out_data[i] = (top_val > 0 && !isNaN(top_val)) ? top_val : base_raster.data[i];
    }

    await GeoPNG.saveNumberRasterImageAsync({
      data: out_data,
      file_path: out_file,
      format: "float32",
      height: base_raster.height,
      width: base_raster.width
    });

    return out_file;
  }

  //2. Linear raster interpolation between two years
  if (task_type === "linear_interpolation") {
    GeoPNG.linearInterpolation(
      task.from_file_path,
      task.to_file_path,
      task.output_file_path,
      task.options
    );
    return task.output_file_path;
  }

  //3. Areal timeseries clamping
  if (task_type === "areal_clamping") {
    let indexing = task.areal_indexing;
    let input_path = task.input_path;
    let output_path = task.output_path;

    if (!fs.existsSync(input_path)) return null;

    let raster = await GeoPNG.loadNumberRasterImageAsync(input_path, { format: task.format || "float32" });
    let clamped_data = GeoPNG.applyArealClamping({
      data: raster.data,
      mask_areas: indexing.mask_areas,
      mask_pixel_indices: indexing.mask_pixel_indices,
      mode: task.mode,
      targets: task.targets,
      weights: task.weights
    });

    await GeoPNG.saveNumberRasterImageAsync({
      data: clamped_data,
      file_path: output_path,
      format: task.format || "float32",
      height: indexing.height,
      width: indexing.width
    });

    return output_path;
  }

  //4. Raster math operation (multiply, divide, add, subtract, scale)
  if (task_type === "raster_operation") {
    let format = task.format || "float32";
    let format_1 = task.format_1 || format;
    let format_2 = task.format_2 || format;
    let input_path_1 = task.input_path_1 || task.a_path || task.input_path;
    let input_path_2 = task.input_path_2 || task.b_path;
    let op = task.operation || task.op || "multiply";
    let output_path = task.output_path;

    if (!fs.existsSync(input_path_1)) return null;

    let raster1 = await GeoPNG.loadNumberRasterImageAsync(input_path_1, { format: format_1 });
    let total_pixels = raster1.data.length;
    let output_data = new Float32Array(total_pixels);

    if (input_path_2 && fs.existsSync(input_path_2)) {
      let data1 = raster1.data;
      let raster2 = await GeoPNG.loadNumberRasterImageAsync(input_path_2, { format: format_2 });
      let data2 = raster2.data;

      if (op === "multiply") {
        for (let i = 0; i < total_pixels; i++) {
          let v1 = data1[i];
          let v2 = data2[i];
          if (v1 > 0 && v2 > 0 && isFinite(v1) && isFinite(v2)) {
            let val = v1*v2;
            output_data[i] = (isFinite(val) && val < 3.402823466e38) ? val : 0;
          } else {
            output_data[i] = 0;
          }
        }
      } else if (op === "divide") {
        let max_val = (task.max_val !== undefined) ? task.max_val : 3.402823466e38;
        let min_denom = (task.min_denominator !== undefined) ? task.min_denominator : 1e-12;
        let threshold = task.log_compression_threshold;
        let clamp_alpha = (threshold !== undefined) ? (task.clamp_alpha || threshold*0.1) : 0;

        for (let i = 0; i < total_pixels; i++) {
          let v1 = data1[i];
          let v2 = data2[i];
          if (v1 > 0 && v2 >= min_denom && isFinite(v1) && isFinite(v2)) {
            let val = v1/v2;
            if (isFinite(val)) {
              if (threshold !== undefined && val > threshold) {
                val = threshold + clamp_alpha*Math.log(1 + ((val - threshold)/clamp_alpha));
              }
              if (val > max_val) val = max_val;
              output_data[i] = (isFinite(val) && val < 3.402823466e38) ? val : 0;
            } else {
              output_data[i] = 0;
            }
          } else {
            output_data[i] = 0;
          }
        }
      } else if (op === "add") {
        for (let i = 0; i < total_pixels; i++) output_data[i] = data1[i] + data2[i];
      } else if (op === "subtract") {
        for (let i = 0; i < total_pixels; i++) output_data[i] = data1[i] - data2[i];
      } else if (op === "subtract_clamped") {
        for (let i = 0; i < total_pixels; i++) output_data[i] = Math.max(0, data1[i] - data2[i]);
      } else if (op === "overlay") {
        for (let i = 0; i < total_pixels; i++) output_data[i] = (data2[i] > 0) ? data2[i] : data1[i];
      } else if (op === "slope" || op === "delta") {
        let scalar = (task.scalar !== undefined) ? task.scalar : 1;
        for (let i = 0; i < total_pixels; i++) {
          let v1 = data1[i];
          let v2 = data2[i];
          output_data[i] = (isFinite(v1) && isFinite(v2)) ? (v1 - v2)*scalar : 0;
        }
      }
    } else if (task.scalar !== undefined) {
      let data1 = raster1.data;
      let scalar = task.scalar;
      for (let i = 0; i < total_pixels; i++) output_data[i] = data1[i]*scalar;
    }

    let out_dir = path.dirname(output_path);
    if (!fs.existsSync(out_dir)) fs.mkdirSync(out_dir, { recursive: true });

    await GeoPNG.saveNumberRasterImageAsync({
      data: output_data,
      file_path: output_path,
      format: format,
      height: raster1.height,
      width: raster1.width
    });

    return output_path;
  }

  //5. Train OLS Model on continuous raster target & covariates
  if (task_type === "train_ols") {
    let covariates_map = task.covariates_map || {};
    let options = task.options || {};
    let output_file_path = path.resolve(task.output_file_path);
    let target_file_path = path.resolve(task.target_file_path);
    let target_format = task.target_format || "float32";

    let out_dir = path.dirname(output_file_path);
    if (!fs.existsSync(out_dir)) fs.mkdirSync(out_dir, { recursive: true });

    if (!fs.existsSync(target_file_path))
      throw new Error(`Target raster not found: ${target_file_path}`);

    let loaded_obj = await Statistics.loadOLSCovariates(target_file_path, {
      covariates_obj: covariates_map,
      formatting_parameters: options.formatting_parameters || [],
      utility_format: target_format
    });

    if (options.filter_zero_targets && loaded_obj && loaded_obj.Y) {
      let filtered_X = [];
      let filtered_Y = [];
      for (let j = 0; j < loaded_obj.Y.length; j++) {
        let utility_val = loaded_obj.Y[j][0];
        if (utility_val !== 0 && !isNaN(utility_val)) {
          filtered_X.push(loaded_obj.X[j]);
          filtered_Y.push(loaded_obj.Y[j]);
        }
      }
      loaded_obj.X = filtered_X;
      loaded_obj.Y = filtered_Y;
    }

    if (!loaded_obj || !loaded_obj.X || loaded_obj.X.length === 0)
      return { key: options.key, reason: "no_valid_samples", success: false };

    let model = Statistics.trainOLSModel(output_file_path, loaded_obj, options);
    return {
      key: options.key,
      output_file_path: output_file_path,
      sample_count: loaded_obj.X.length,
      success: true
    };
  }

  //6. Train OLS Model on point dataset & covariates
  if (task_type === "train_ols_points") {
    let covariates_map = task.covariates_map || {};
    let options = task.options || {};
    let output_file_path = path.resolve(task.output_file_path);
    let points = task.points || [];
    let target_year = task.target_year;

    let out_dir = path.dirname(output_file_path);
    if (!fs.existsSync(out_dir)) fs.mkdirSync(out_dir, { recursive: true });

    let dataset = await Statistics.LearningFramework.extractPointDataset(points, target_year, {
      covariates_obj: covariates_map,
      covariates_year: task.covariates_year || target_year
    });

    if (!dataset || !dataset.X || dataset.X.length === 0)
      return { key: options.key, reason: "no_valid_samples", success: false };

    let model = Statistics.trainOLSModel(output_file_path, dataset, options);
    return {
      key: options.key,
      output_file_path: output_file_path,
      sample_count: dataset.X.length,
      success: true
    };
  }

  //7. Generate OLS continuous prediction raster
  if (task_type === "generate_ols_raster") {
    let covariates_map = task.covariates_map || {};
    let model_obj = task.model_obj;
    let options = task.options || {};
    let output_file_path = path.resolve(task.output_file_path);

    let out_dir = path.dirname(output_file_path);
    if (!fs.existsSync(out_dir)) fs.mkdirSync(out_dir, { recursive: true });

    await Statistics.generateOLSRaster(output_file_path, {
      ...options,
      covariates_obj: covariates_map,
      model_obj: model_obj
    });

    return { output_file_path: output_file_path, success: true };
  }

  //8. Train Multinomial Logit Model
  if (task_type === "train_multinomial_logit") {
    let categories = task.categories || [];
    let covariates_map = task.covariates_map || {};
    let model_path = path.resolve(task.model_path);
    let opt = task.options || {};
    let target_paths = task.target_paths || {};

    let out_dir = path.dirname(model_path);
    if (!fs.existsSync(out_dir)) fs.mkdirSync(out_dir, { recursive: true });

    let cov_rasters = {};
    let valid_keys = [];
    for (let k in covariates_map) {
      let entry = covariates_map[k];
      let fmt = Array.isArray(entry) ? entry[1] : "float32";
      let p = Array.isArray(entry) ? entry[0] : entry;
      if (fs.existsSync(p)) {
        cov_rasters[k] = GeoPNG.loadNumberRasterImage(p, { format: fmt });
        valid_keys.push(k);
      }
    }

    let missing_target = false;
    let target_rasters = {};
    for (let i = 0; i < categories.length; i++) {
      let cat = categories[i];
      let p = target_paths[cat];
      if (!p || !fs.existsSync(p)) {
        missing_target = true;
        break;
      }
      target_rasters[cat] = GeoPNG.loadNumberRasterImage(p, { format: "float32" });
    }

    if (missing_target || valid_keys.length === 0)
      return { reason: "missing_inputs", success: false };

    let filter_raster = null;
    if (task.filter_raster_path && fs.existsSync(task.filter_raster_path))
      filter_raster = GeoPNG.loadNumberRasterImage(task.filter_raster_path, { format: task.filter_format || "float32" });

    let first_target = target_rasters[categories[0]];
    let data_len = first_target.data.length;
    let sample_limit = opt.sample_limit || opt.max_samples || 75000;
    let X = [];
    let Y = [];
    let weights = [];

    // Identify candidate valid populated indices (requiring filter >= 1.0)
    let candidate_indices = [];
    for (let i = 0; i < data_len; i++) {
      if (filter_raster && filter_raster.data[i] < 1.0) continue;
      candidate_indices.push(i);
    }

    let selected_indices = candidate_indices;
    if (candidate_indices.length > sample_limit) {
      selected_indices = [];
      let step = candidate_indices.length / sample_limit;
      for (let s = 0; s < sample_limit; s++)
        selected_indices.push(candidate_indices[Math.floor(s * step)]);
    }

    for (let s = 0; s < selected_indices.length; s++) {
      let i = selected_indices[s];

      let cat_pops = [];
      let total_pop = 0;
      for (let j = 0; j < categories.length; j++) {
        let cp = target_rasters[categories[j]].data[i];
        cp = (isNaN(cp) || cp < 0) ? 0 : cp;
        cat_pops.push(cp);
        total_pop += cp;
      }
      if (total_pop < 1.0) continue;

      let is_valid = true;
      let x_row = [];
      for (let j = 0; j < valid_keys.length; j++) {
        let val = cov_rasters[valid_keys[j]].data[i];
        if (isNaN(val)) {
          is_valid = false;
          break;
        }
        x_row.push(val);
      }
      if (!is_valid) continue;

      let prop_row = new Float32Array(categories.length);
      let inv_total = 1/total_pop;
      for (let j = 0; j < categories.length; j++)
        prop_row[j] = cat_pops[j]*inv_total;

      X.push(x_row);
      Y.push(prop_row);
      weights.push(Math.log(1 + total_pop));
    }

    if (X.length === 0)
      return { reason: "no_samples", success: false };

    let model = await Statistics.trainMultinomialLogitModel(model_path, { keys: valid_keys, X: X, Y: Y, weights: weights }, {
      ...opt,
      classes: categories,
      proportions: true,
      reference_class: categories[0]
    });
    return { model_path: model_path, sample_count: X.length, success: !!model };
  }

  //9. Generate Multinomial Logit prediction raster
  if (task_type === "generate_multinomial_raster") {
    let covariates_map = task.covariates_map || {};
    let model_obj = task.model_obj;
    let options = task.options || {};
    let output_file_path = path.resolve(task.output_file_path);

    let out_dir = path.dirname(output_file_path);
    if (!fs.existsSync(out_dir)) fs.mkdirSync(out_dir, { recursive: true });

    await Statistics.generateMultinomialRaster(output_file_path, {
      ...options,
      covariates_obj: covariates_map,
      model_obj: model_obj
    });

    return { output_file_path: output_file_path, success: true };
  }

  //10. Regression raster prediction (OLS / Multinomial logit)
  if (task_type === "predict_raster") {
    return await Statistics.LearningFramework.predictRaster(
      task.output_file_path,
      task.model,
      task.options
    );
  }

  //11. Invoke specified stage method dynamically
  if (task_type === "invoke_method") {
    if (task.module_path) safeRequire(task.module_path);

    let target_class = global[task.class_name];
    if (!target_class || typeof target_class[task.method_name] !== "function")
      throw new Error(`Target class or method not found: ${task.class_name}.${task.method_name}`);

    let args = task.args || [];
    return await target_class[task.method_name](...args);
  }

  //12. Execute serialized handler function
  if (task_type === "eval_handler") {
    let AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    let fn = new AsyncFunction(
      "item",
      "index",
      "context",
      "GeoPNG",
      "Statistics",
      "fs",
      "path",
      `"use strict"; return (${task.handler_source})(item, index, context);`
    );

    return await fn(
      task.item,
      task.index,
      task.context,
      global.GeoPNG,
      global.Statistics,
      global.fs,
      global.path
    );
  }

  if (task_type === "copy") {
    let from_path = task.from_file_path || task.input_path;
    let to_path = task.output_file_path || task.output_path;

    if (from_path && to_path && fs.existsSync(from_path)) {
      let out_dir = path.dirname(to_path);
      if (!fs.existsSync(out_dir)) fs.mkdirSync(out_dir, { recursive: true });
      fs.copyFileSync(from_path, to_path);
      return to_path;
    }
    return null;
  }

  if (task_type === "blank_raster") {
    let blank_data;
    let format = task.format || "float32";
    let height = task.height || 2160;
    let out_dir;
    let out_path = task.output_file_path || task.output_path;
    let width = task.width || 4320;

    blank_data = (format === "float32") ? new Float32Array(width * height) : new Int32Array(width * height);
    out_dir = path.dirname(out_path);
    if (!fs.existsSync(out_dir)) fs.mkdirSync(out_dir, { recursive: true });

    await GeoPNG.saveNumberRasterImageAsync({
      data: blank_data,
      file_path: out_path,
      format: format,
      height: height,
      width: width
    });
    return out_path;
  }

  //13. Stadester raster generation tasks
  if (task_type === "stadester_density_raster") {
    return await population_Stadester_rasters.prepareDensityRaster(task.year, task.options || {});
  }
  if (task_type === "stadester_base_raster") {
    return await population_Stadester_rasters.generateStadesterBaseRaster(task.year, task.options || {});
  }
  if (task_type === "stadester_urban_raster") {
    return await population_Stadester_rasters.generateStadesterUrbanRaster(task.year, task.options || {});
  }
  if (task_type === "stadester_rural_raster") {
    return await population_Stadester_rasters.generateStadesterRuralRaster(task.year, task.options || {});
  }
  if (task_type === "stadester_population_raster") {
    return await population_Stadester_rasters.generateStadesterPopulationRaster(task.year, task.options || {});
  }

  //14. Scale raster to global scalar target
  if (task_type === "scale_to_global") {
    let format = task.format || "float32";
    let input_path = task.input_path;
    let output_path = task.output_path;
    let target = task.target;

    if (!fs.existsSync(input_path)) return null;

    let raster = await GeoPNG.loadNumberRasterImageAsync(input_path, { format: format });
    let total_pixels = raster.data.length;
    let sum = 0;
    for (let i = 0; i < total_pixels; i++) {
      let v = raster.data[i];
      if (v > 0 && isFinite(v)) sum += v;
    }

    let scalar = (sum > 0 && target > 0) ? (target / sum) : 1;
    let output_data = new Float32Array(total_pixels);
    for (let i = 0; i < total_pixels; i++) {
      let v = raster.data[i];
      output_data[i] = (v > 0 && isFinite(v)) ? (v * scalar) : 0;
    }

    let out_dir = path.dirname(output_path);
    if (!fs.existsSync(out_dir)) fs.mkdirSync(out_dir, { recursive: true });

    await GeoPNG.saveNumberRasterImageAsync({
      data: output_data,
      file_path: output_path,
      format: format,
      height: raster.height,
      width: raster.width
    });

    return { output_path: output_path, scalar: scalar, sum: sum, success: true };
  }

  //15. Scale raster to national geocode targets
  if (task_type === "scale_to_national") {
    let format = task.format || "float32";
    let geocode_map = task.geocode_map || {};
    let geocodes_raster_path = task.geocodes_raster_path;
    let input_path = task.input_path;
    let output_path = task.output_path;
    let target_gdp_map = task.target_gdp_map || {};

    if (!fs.existsSync(input_path)) return null;

    if (!global._cached_geocodes_raster || global._cached_geocodes_path !== geocodes_raster_path) {
      if (fs.existsSync(geocodes_raster_path)) {
        global._cached_geocodes_raster = GeoPNG.loadImage(geocodes_raster_path);
        global._cached_geocodes_path = geocodes_raster_path;
      }
    }
    let geocode_raster = global._cached_geocodes_raster;
    if (!geocode_raster) return null;

    let raster = await GeoPNG.loadNumberRasterImageAsync(input_path, { format: format });
    let total_pixels = raster.data.length;
    let local_gdp_scalars = {};
    let local_gdp_sums = {};

    //Pass 1: Sum per geocode
    for (let i = 0; i < total_pixels; i++) {
      let val = raster.data[i];
      if (val > 0 && isFinite(val)) {
        let byte_idx = i * 4;
        let colour_key = geocode_raster.data[byte_idx] + "," + geocode_raster.data[byte_idx + 1] + "," + geocode_raster.data[byte_idx + 2];
        let geocodes = geocode_map[colour_key];
        if (geocodes) {
          for (let x = 0; x < geocodes.length; x++) {
            let code = geocodes[x];
            local_gdp_sums[code] = (local_gdp_sums[code] || 0) + val;
          }
        }
      }
    }

    //Calculate scalars
    let sum_keys = Object.keys(local_gdp_sums);
    for (let x = 0; x < sum_keys.length; x++) {
      let code = sum_keys[x];
      let target_val = target_gdp_map[code];
      let sum_val = local_gdp_sums[code];
      if (target_val !== undefined && sum_val > 0) {
        local_gdp_scalars[code] = target_val / sum_val;
      } else {
        local_gdp_scalars[code] = 1;
      }
    }

    //Pass 2: Apply scalars
    let output_data = new Float32Array(total_pixels);
    for (let i = 0; i < total_pixels; i++) {
      let val = raster.data[i];
      if (val > 0 && isFinite(val)) {
        let byte_idx = i * 4;
        let colour_key = geocode_raster.data[byte_idx] + "," + geocode_raster.data[byte_idx + 1] + "," + geocode_raster.data[byte_idx + 2];
        let geocodes = geocode_map[colour_key];
        let scaled = false;
        if (geocodes) {
          for (let x = 0; x < geocodes.length; x++) {
            let code = geocodes[x];
            if (target_gdp_map[code] !== undefined) {
              output_data[i] = val * (local_gdp_scalars[code] || 1);
              scaled = true;
              break;
            }
          }
        }
        if (!scaled) output_data[i] = val;
      } else {
        output_data[i] = 0;
      }
    }

    let out_dir = path.dirname(output_path);
    if (!fs.existsSync(out_dir)) fs.mkdirSync(out_dir, { recursive: true });

    await GeoPNG.saveNumberRasterImageAsync({
      data: output_data,
      file_path: output_path,
      format: format,
      height: raster.height,
      width: raster.width
    });

    return { output_path: output_path, success: true };
  }

  //16. Clamp demographic cohorts to Stadester population
  if (task_type === "clamp_cohorts_to_stadester") {
    let cohorts = task.cohorts || [];
    let logit_rasters_folder = task.logit_rasters_folder;
    let output_folder = task.output_folder;
    let popc_format = task.popc_format || "float32";
    let popc_path = task.popc_path;
    let year = task.year;

    if (!fs.existsSync(popc_path)) return null;

    let popc_raster = await GeoPNG.loadNumberRasterImageAsync(popc_path, { format: popc_format });
    let prob_rasters = {};

    for (let i = 0; i < cohorts.length; i++) {
      let prob_path = path.join(logit_rasters_folder, `logit_${year}_class_${cohorts[i]}.png`);
      if (!fs.existsSync(prob_path)) return null;
      prob_rasters[cohorts[i]] = await GeoPNG.loadNumberRasterImageAsync(prob_path, { format: "float32" });
    }

    let total_pixels = popc_raster.data.length;
    let prob_sums = new Float32Array(total_pixels);

    for (let i = 0; i < cohorts.length; i++) {
      let data = prob_rasters[cohorts[i]].data;
      for (let j = 0; j < total_pixels; j++) {
        let val = data[j];
        if (!isNaN(val) && val > 0) prob_sums[j] += val;
      }
    }

    let out_dir = path.resolve(output_folder);
    if (!fs.existsSync(out_dir)) fs.mkdirSync(out_dir, { recursive: true });

    for (let i = 0; i < cohorts.length; i++) {
      let c = cohorts[i];
      let out_path = path.join(output_folder, `global_${c}_${year}.png`);
      let prob_data = prob_rasters[c].data;
      let output_data = new Float32Array(total_pixels);

      for (let j = 0; j < total_pixels; j++) {
        let pop = popc_raster.data[j];
        if (pop <= 0) continue;

        let sum_p = prob_sums[j];
        let p_val = prob_data[j];
        if (isNaN(p_val) || p_val < 0) p_val = 0;

        if (sum_p <= 0) {
          output_data[j] = pop/cohorts.length;
        } else {
          output_data[j] = pop*(p_val/sum_p);
        }
      }

      await GeoPNG.saveNumberRasterImageAsync({
        data: output_data,
        file_path: out_path,
        format: "float32",
        height: popc_raster.height,
        width: popc_raster.width
      });
    }

    return { success: true, year: year };
  }

  //17. Interpolate WID raster with missing data fallback
  if (task_type === "interpolate_wid_raster") {
    let brushed_target_path = task.brushed_target_path;
    let clamped_source = task.clamped_source;
    let generated = false;
    let interp_domain = task.interp_domain || [1700, 1800];
    let interp_gap = interp_domain[1] - interp_domain[0];
    let output_path = task.output_path;
    let source_path = task.source_path;
    let year = task.year;

    let out_dir = path.dirname(output_path);
    if (!fs.existsSync(out_dir)) fs.mkdirSync(out_dir, { recursive: true });

    if (year < interp_domain[0]) {
      if (fs.existsSync(source_path)) {
        fs.copyFileSync(source_path, output_path);
        generated = true;
      }
    } else if (year >= interp_domain[0] && year < interp_domain[1]) {
      if (fs.existsSync(source_path) && fs.existsSync(brushed_target_path)) {
        let fraction = (year - interp_domain[0]) / interp_gap;
        GeoPNG.linearInterpolation(source_path, brushed_target_path, output_path, {
          format: "float32",
          fraction: fraction,
          lower_value_threshold: 0,
          threshold_fraction: 0
        });
        generated = true;
      }
    } else {
      if (fs.existsSync(clamped_source)) {
        fs.copyFileSync(clamped_source, output_path);
        generated = true;
      }
    }

    if (generated && fs.existsSync(output_path)) {
      let out_raster = GeoPNG.loadNumberRasterImage(output_path, { format: "float32" });
      let clamped_raster = fs.existsSync(clamped_source) ? GeoPNG.loadNumberRasterImage(clamped_source, { format: "float32" }) : null;
      let ols_raster = fs.existsSync(source_path) ? GeoPNG.loadNumberRasterImage(source_path, { format: "float32" }) : null;
      let modified = false;

      for (let j = 0; j < out_raster.data.length; j++) {
        if (out_raster.data[j] === 0) {
          if (clamped_raster && clamped_raster.data[j] !== 0) {
            out_raster.data[j] = clamped_raster.data[j];
            modified = true;
          } else if (ols_raster && ols_raster.data[j] !== 0) {
            out_raster.data[j] = ols_raster.data[j];
            modified = true;
          }
        }
      }

      if (modified) {
        GeoPNG.saveNumberRasterImage({
          file_path: output_path,
          format: "float32",
          height: out_raster.height,
          width: out_raster.width,
          function: (idx) => out_raster.data[idx]
        });
      }
    }

    return output_path;
  }

  //18. Clamp professions percentages and aggregates
  if (task_type === "clamp_professions") {
    let age_sex_folder = task.age_sex_folder;
    let categories = task.categories || ["agriculture", "manufacturing", "services", "informal_labour", "not_in_work"];
    let lfpr_folder = task.lfpr_folder;
    let logit_rasters_folder = task.logit_rasters_folder;
    let olivetti_categories = task.olivetti_categories || ["agriculture", "manufacturing", "services", "informal_labour"];
    let output_aggregates = task.output_aggregates;
    let output_percentages = task.output_percentages;
    let sexes = task.sexes || ["m", "f"];
    let working_cohorts = task.working_cohorts || ["15", "20", "25", "30", "35", "40", "45", "50", "55", "60", "65", "70", "75", "80"];
    let year = task.year;

    let agg_t = {};
    for (let i = 0; i < categories.length; i++) agg_t[categories[i]] = null;
    let height = 2160;
    let pop_t = null;
    let width = 4320;

    for (let s = 0; s < sexes.length; s++) {
      let sex = sexes[s];
      let lfpr_path = path.join(lfpr_folder, `lfpr_${sex}_${year}.png`);
      if (!fs.existsSync(lfpr_path)) continue;

      let lfpr_raster = await GeoPNG.loadNumberRasterImageAsync(lfpr_path, { format: "float32" });
      width = lfpr_raster.width;
      height = lfpr_raster.height;
      let data_len = lfpr_raster.data.length;
      let pop_raster = new Float32Array(data_len);

      for (let i = 0; i < working_cohorts.length; i++) {
        let cp = path.join(age_sex_folder, `${sex}_${working_cohorts[i]}_${year}.png`);
        if (fs.existsSync(cp)) {
          let c_raster = await GeoPNG.loadNumberRasterImageAsync(cp, { format: "float32" });
          for (let j = 0; j < data_len; j++) {
            let val = c_raster.data[j];
            if (!isNaN(val) && val > 0) pop_raster[j] += val;
          }
        }
      }

      if (!pop_t) pop_t = new Float32Array(data_len);
      for (let i = 0; i < data_len; i++) pop_t[i] += pop_raster[i];

      let prob_rasters = {};
      let missing_probs = false;

      for (let i = 0; i < olivetti_categories.length; i++) {
        let p = path.join(logit_rasters_folder, `logit_${sex}_${year}_class_${olivetti_categories[i]}.png`);
        if (!fs.existsSync(p)) { missing_probs = true; break; }
        prob_rasters[olivetti_categories[i]] = await GeoPNG.loadNumberRasterImageAsync(p, { format: "float32" });
      }

      if (missing_probs) continue;

      let prob_sum_working = new Float32Array(data_len);
      for (let i = 0; i < olivetti_categories.length; i++) {
        let data = prob_rasters[olivetti_categories[i]].data;
        for (let j = 0; j < data_len; j++) {
          let val = data[j];
          if (!isNaN(val) && val > 0) prob_sum_working[j] += val;
        }
      }

      for (let i = 0; i < categories.length; i++) {
        let c = categories[i];
        if (!agg_t[c]) agg_t[c] = new Float32Array(data_len);

        let pct_arr = new Float32Array(data_len);
        let agg_arr = new Float32Array(data_len);
        let prob_data = prob_rasters[c] ? prob_rasters[c].data : null;

        for (let j = 0; j < data_len; j++) {
          let pop = pop_raster[j];
          if (pop <= 0) continue;

          let lfpr = lfpr_raster.data[j];
          if (isNaN(lfpr)) lfpr = 0;

          let final_pct = 0;
          if (c === "not_in_work") {
            final_pct = Math.max(0, 1.0 - lfpr);
          } else {
            let sum_w = prob_sum_working[j];
            let p_val = prob_data[j];
            if (isNaN(p_val) || p_val < 0) p_val = 0;

            if (sum_w <= 0) {
              final_pct = lfpr / olivetti_categories.length;
            } else {
              final_pct = lfpr * (p_val / sum_w);
            }
          }

          pct_arr[j] = final_pct;
          agg_arr[j] = final_pct * pop;
          agg_t[c][j] += agg_arr[j];
        }

        await GeoPNG.saveNumberRasterImageAsync({
          data: pct_arr,
          file_path: path.join(output_percentages, `${c}_${sex}_${year}.png`),
          format: "float32",
          height: height,
          width: width
        });

        await GeoPNG.saveNumberRasterImageAsync({
          data: agg_arr,
          file_path: path.join(output_aggregates, `${c}_${sex}_${year}.png`),
          format: "float32",
          height: height,
          width: width
        });
      }
    }

    if (pop_t) {
      for (let i = 0; i < categories.length; i++) {
        let c = categories[i];
        let total_pct = new Float32Array(pop_t.length);
        for (let idx = 0; idx < pop_t.length; idx++) {
          let total_p = pop_t[idx];
          total_pct[idx] = (total_p > 0) ? (agg_t[c][idx] / total_p) : 0;
        }

        await GeoPNG.saveNumberRasterImageAsync({
          data: total_pct,
          file_path: path.join(output_percentages, `${c}_t_${year}.png`),
          format: "float32",
          height: height,
          width: width
        });

        await GeoPNG.saveNumberRasterImageAsync({
          data: agg_t[c],
          file_path: path.join(output_aggregates, `${c}_t_${year}.png`),
          format: "float32",
          height: height,
          width: width
        });
      }
    }

    return { success: true, year: year };
  }

  //19. Scale to global sum
  if (task_type === "scale_to_global") {
    let format = task.format || "float32";
    let input_path = task.input_path;
    let output_path = task.output_path;
    let target = (task.target !== undefined) ? task.target : task.target_sum;

    if (!fs.existsSync(input_path)) return null;

    let raster = await GeoPNG.loadNumberRasterImageAsync(input_path, { format: format });
    let total_pixels = raster.data.length;
    let sum = 0;
    for (let i = 0; i < total_pixels; i++) {
      let v = raster.data[i];
      if (isFinite(v) && v > 0) sum += v;
    }

    let scalar = (sum > 0) ? (target / sum) : 1;
    let out_data = new Float32Array(total_pixels);
    for (let i = 0; i < total_pixels; i++) {
      out_data[i] = raster.data[i] * scalar;
    }

    let out_dir = path.dirname(output_path);
    if (!fs.existsSync(out_dir)) fs.mkdirSync(out_dir, { recursive: true });

    await GeoPNG.saveNumberRasterImageAsync({
      data: out_data,
      file_path: output_path,
      format: format,
      height: raster.height,
      width: raster.width
    });

    return output_path;
  }

  //20. Scale to national targets
  if (task_type === "scale_to_national") {
    let geocode_map = task.geocode_map || {};
    let geocodes_raster_path = task.geocodes_raster_path;
    let input_path = task.input_path;
    let output_path = task.output_path;
    let target_gdp_map = task.target_gdp_map || {};

    if (!fs.existsSync(input_path) || !fs.existsSync(geocodes_raster_path)) return null;

    let geocode_raster = GeoPNG.loadImage(geocodes_raster_path);
    let raster = await GeoPNG.loadNumberRasterImageAsync(input_path, { format: "float32" });
    let total_pixels = raster.data.length;

    let sums = {};
    for (let i = 0; i < total_pixels; i++) {
      let v = raster.data[i];
      if (v <= 0 || !isFinite(v)) continue;
      let b_idx = i * 4;
      let k = `${geocode_raster.data[b_idx]},${geocode_raster.data[b_idx+1]},${geocode_raster.data[b_idx+2]}`;
      let geocodes = geocode_map[k];
      if (geocodes) {
        for (let x = 0; x < geocodes.length; x++) {
          let code = geocodes[x];
          sums[code] = (sums[code] || 0) + v;
        }
      }
    }

    let scalars = {};
    for (let k in sums) {
      let target = target_gdp_map[k];
      scalars[k] = (target !== undefined && sums[k] > 0) ? (target / sums[k]) : 1;
    }

    let out_data = new Float32Array(total_pixels);
    for (let i = 0; i < total_pixels; i++) {
      let v = raster.data[i];
      if (v <= 0 || !isFinite(v)) { out_data[i] = 0; continue; }
      let b_idx = i * 4;
      let k = `${geocode_raster.data[b_idx]},${geocode_raster.data[b_idx+1]},${geocode_raster.data[b_idx+2]}`;
      let geocodes = geocode_map[k];
      let scalar = 1;
      if (geocodes) {
        for (let x = 0; x < geocodes.length; x++) {
          let s = scalars[geocodes[x]];
          if (s !== undefined) { scalar = s; break; }
        }
      }
      out_data[i] = v * scalar;
    }

    let out_dir = path.dirname(output_path);
    if (!fs.existsSync(out_dir)) fs.mkdirSync(out_dir, { recursive: true });

    await GeoPNG.saveNumberRasterImageAsync({
      data: out_data,
      file_path: output_path,
      format: "float32",
      height: raster.height,
      width: raster.width
    });

    return output_path;
  }

  //21. Convert float32 to int32 with custom rounding
  if (task_type === "convert_to_int32") {
    let input_path = task.input_path;
    let output_path = task.output_path;
    let rounding_method = task.rounding_method || "round";

    if (!fs.existsSync(input_path)) return null;

    let raster = await GeoPNG.loadNumberRasterImageAsync(input_path, { format: "float32" });
    let total_pixels = raster.data.length;
    let out_data = new Int32Array(total_pixels);

    if (rounding_method === "ceil") {
      for (let i = 0; i < total_pixels; i++) out_data[i] = Math.ceil(raster.data[i]);
    } else {
      for (let i = 0; i < total_pixels; i++) out_data[i] = Math.round(raster.data[i]);
    }

    let out_dir = path.dirname(output_path);
    if (!fs.existsSync(out_dir)) fs.mkdirSync(out_dir, { recursive: true });

    await GeoPNG.saveNumberRasterImageAsync({
      data: out_data,
      file_path: output_path,
      format: "int32",
      height: raster.height,
      width: raster.width
    });

    return output_path;
  }

  //22. Derive migration rasters (births, deaths, cohort sex ratio, net migration)
  if (task_type === "derive_migration_rasters") {
    let births_path = task.births_path;
    let delta_popc_path = task.delta_popc_path;
    let female_cohort_paths = task.female_cohort_paths || [];
    let female_deaths_path = task.female_deaths_path;
    let female_migration_path = task.female_migration_path;
    let male_cohort_paths = task.male_cohort_paths || [];
    let male_deaths_path = task.male_deaths_path;
    let male_migration_path = task.male_migration_path;
    let net_migration_path = task.net_migration_path;
    let overwrite = (task.overwrite !== undefined) ? task.overwrite : true;
    let popc_path = task.popc_path;
    let previous_popc_path = task.previous_popc_path;
    let year_gap = task.year_gap;

    if (!overwrite && fs.existsSync(net_migration_path) && fs.existsSync(female_migration_path) && fs.existsSync(male_migration_path))
      return { year: task.year, skipped: true };

    if (!fs.existsSync(births_path) || !fs.existsSync(female_deaths_path) || !fs.existsSync(male_deaths_path))
      return null;

    let delta_popc_raster = null;
    if (fs.existsSync(delta_popc_path)) {
      let raw_delta = await GeoPNG.loadNumberRasterImageAsync(delta_popc_path, { format: "float32" });
      let len = raw_delta.data.length;
      let scaled_delta = new Float32Array(len);
      for (let i = 0; i < len; i++) scaled_delta[i] = raw_delta.data[i] / year_gap;
      delta_popc_raster = {
        data: scaled_delta,
        height: raw_delta.height,
        width: raw_delta.width
      };
    } else {
      if (!fs.existsSync(popc_path) || !fs.existsSync(previous_popc_path)) return null;
      let popc_raster = await GeoPNG.loadNumberRasterImageAsync(popc_path, { format: "float32" });
      let prev_popc = await GeoPNG.loadNumberRasterImageAsync(previous_popc_path, { format: "float32" });
      let len = popc_raster.data.length;
      let diff_data = new Float32Array(len);
      for (let i = 0; i < len; i++) diff_data[i] = (popc_raster.data[i] - prev_popc.data[i]) / year_gap;
      delta_popc_raster = {
        data: diff_data,
        height: popc_raster.height,
        width: popc_raster.width
      };
    }

    let len = delta_popc_raster.data.length;
    let f_pop = new Float32Array(len);
    let m_pop = new Float32Array(len);

    for (let c = 0; c < female_cohort_paths.length; c++) {
      let r_path = female_cohort_paths[c];
      if (fs.existsSync(r_path)) {
        let r = await GeoPNG.loadNumberRasterImageAsync(r_path, { format: "float32" });
        for (let i = 0; i < len; i++) if (r.data[i] > 0) f_pop[i] += r.data[i];
      }
    }
    for (let c = 0; c < male_cohort_paths.length; c++) {
      let r_path = male_cohort_paths[c];
      if (fs.existsSync(r_path)) {
        let r = await GeoPNG.loadNumberRasterImageAsync(r_path, { format: "float32" });
        for (let i = 0; i < len; i++) if (r.data[i] > 0) m_pop[i] += r.data[i];
      }
    }

    let delta_female = new Float32Array(len);
    let delta_male = new Float32Array(len);

    for (let i = 0; i < len; i++) {
      let tot = f_pop[i] + m_pop[i];
      let f_ratio = (tot > 0) ? (f_pop[i] / tot) : 0.5;
      delta_female[i] = delta_popc_raster.data[i] * f_ratio;
      delta_male[i] = delta_popc_raster.data[i] * (1 - f_ratio);
    }

    let births_raster = await GeoPNG.loadNumberRasterImageAsync(births_path, { format: "float32" });
    let female_deaths_raster = await GeoPNG.loadNumberRasterImageAsync(female_deaths_path, { format: "float32" });
    let male_deaths_raster = await GeoPNG.loadNumberRasterImageAsync(male_deaths_path, { format: "float32" });

    let out_f_mig = new Float32Array(len);
    let out_m_mig = new Float32Array(len);
    let out_net_mig = new Float32Array(len);

    for (let i = 0; i < len; i++) {
      let b = (isNaN(births_raster.data[i])) ? 0 : births_raster.data[i];
      let fd = (isNaN(female_deaths_raster.data[i])) ? 0 : female_deaths_raster.data[i];
      let md = (isNaN(male_deaths_raster.data[i])) ? 0 : male_deaths_raster.data[i];

      out_f_mig[i] = delta_female[i] - (b / 2) + fd;
      out_m_mig[i] = delta_male[i] - (b / 2) + md;
      out_net_mig[i] = delta_popc_raster.data[i] - b + fd + md;
    }

    let ensureDir = (p) => {
      let d = path.dirname(p);
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    };
    ensureDir(female_migration_path);
    ensureDir(male_migration_path);
    ensureDir(net_migration_path);

    await GeoPNG.saveNumberRasterImageAsync({
      data: out_f_mig,
      file_path: female_migration_path,
      format: "float32",
      height: delta_popc_raster.height,
      width: delta_popc_raster.width
    });
    await GeoPNG.saveNumberRasterImageAsync({
      data: out_m_mig,
      file_path: male_migration_path,
      format: "float32",
      height: delta_popc_raster.height,
      width: delta_popc_raster.width
    });
    await GeoPNG.saveNumberRasterImageAsync({
      data: out_net_mig,
      file_path: net_migration_path,
      format: "float32",
      height: delta_popc_raster.height,
      width: delta_popc_raster.width
    });

    return { year: task.year, success: true };
  }


  //7. Train ALR Compositional Model
  if (task_type === "train_alr_model") {
    let categories = task.categories || [];
    let covariates_map = task.covariates_map || {};
    let model_path = path.resolve(task.model_path);
    let opt = task.options || {};
    let target_paths = task.target_paths || {};
    
    let cov_rasters = {};
    let valid_keys = [];
    for (let k in covariates_map) {
      let entry = covariates_map[k];
      let fmt = Array.isArray(entry) ? entry[1] : "float32";
      let p = Array.isArray(entry) ? entry[0] : entry;
      if (fs.existsSync(p)) {
        cov_rasters[k] = GeoPNG.loadNumberRasterImage(p, { format: fmt });
        valid_keys.push(k);
      }
    }
    
    let missing_target = false;
    let target_rasters = {};
    for (let i = 0; i < categories.length; i++) {
      let cat = categories[i];
      let p = target_paths[cat];
      if (!p || !fs.existsSync(p)) {
        missing_target = true;
        break;
      }
      target_rasters[cat] = GeoPNG.loadNumberRasterImage(p, { format: "float32" });
    }
    
    if (missing_target || valid_keys.length === 0) return null;
    
    let filter_raster = null;
    if (task.filter_raster_path && fs.existsSync(task.filter_raster_path))
      filter_raster = GeoPNG.loadNumberRasterImage(task.filter_raster_path, { format: task.filter_format || "float32" });
    
    let first_target = target_rasters[categories[0]];
    let data_len = first_target.data.length;
    let X = [];
    let Y = [];
    
    for (let i = 0; i < data_len; i++) {
      if (filter_raster && filter_raster.data[i] <= 0) continue;
      
      let cat_pops = [];
      let total_pop = 0;
      for (let j = 0; j < categories.length; j++) {
        let cp = target_rasters[categories[j]].data[i];
        cp = (isNaN(cp) || cp < 0) ? 0 : cp;
        cat_pops.push(cp);
        total_pop += cp;
      }
      if (total_pop <= 0) continue;
      
      let is_valid = true;
      let x_row = [];
      for (let j = 0; j < valid_keys.length; j++) {
        let val = cov_rasters[valid_keys[j]].data[i];
        if (isNaN(val)) {
          is_valid = false;
          break;
        }
        x_row.push(val);
      }
      if (!is_valid) continue;
      
      let prop_row = new Float32Array(categories.length);
      let inv_total = 1/total_pop;
      for (let j = 0; j < categories.length; j++)
        prop_row[j] = cat_pops[j]*inv_total;
      
      X.push(x_row);
      Y.push(prop_row);
    }
    
    if (X.length === 0) return null;
    
    let model = await Statistics.trainALRModel(model_path, {
      categories: categories,
      keys: valid_keys,
      reference_category: task.reference_category || categories[0],
      X: X,
      Y: Y
    }, opt);
    return { model_path: model_path, success: !!model };
  }

  //8. Generate ALR Raster
  if (task_type === "generate_alr_raster") {
    let output_file_path = task.output_file_path;
    let model_obj = task.model_obj;
    let covariates_map = task.covariates_map;
    let opt = task.options || {};
    
    await Statistics.generateALRRaster(output_file_path, {
      ...opt,
      covariates_obj: covariates_map,
      model_obj: model_obj
    });
    return { output_file_path: output_file_path, success: true };
  }

  //9. Clamp Cohorts with Isotonic (PAVA), Whittaker-Henderson, or Piecewise-Kernel Graduation
  if (task_type === "clamp_cohorts_piecewise" || task_type === "clamp_cohorts_isotonic" || task_type === "clamp_cohorts_to_stadester" || task_type === "clamp_cohorts_whittaker") {
    let cohorts = task.cohorts || [];
    let logit_folder = task.logit_rasters_folder;
    let output_folder = task.output_folder;
    let popc_path = task.popc_path;
    let year = task.year;
    let hmd_folder = task.hmd_folder || (global.h2 ? path.join(global.h2, "age_sex_HMD/2.clamped_to_stadester/") : null);

    // Compute piecewise-kernel weight w in [0, 1] (0 = pure PAVA, 1 = pure Whittaker)
    let cdt_start_year = (task.cdt_start_year !== undefined) ? task.cdt_start_year : 1750;
    let cdt_end_year = (task.cdt_end_year !== undefined) ? task.cdt_end_year : 1850;
    let cdt_steepness = (task.cdt_steepness !== undefined) ? task.cdt_steepness : 8;

    let wh_weight = 1.0;
    if (task_type === "clamp_cohorts_isotonic" || task.smoothing_method === "isotonic") {
      wh_weight = 0.0;
    } else if (task_type === "clamp_cohorts_whittaker" || task.smoothing_method === "whittaker_henderson" || task.smoothing_method === "whittaker") {
      wh_weight = 1.0;
    } else {
      wh_weight = (typeof Statistics.getLogisticKernelWeight === "function") ?
        Statistics.getLogisticKernelWeight(year, cdt_start_year, cdt_end_year, { steepness: cdt_steepness }) :
        ((year <= cdt_start_year) ? 0.0 : ((year >= cdt_end_year) ? 1.0 : (year - cdt_start_year) / (cdt_end_year - cdt_start_year)));
    }

    if (!fs.existsSync(popc_path)) return null;
    let popc_raster = await GeoPNG.loadNumberRasterImageAsync(popc_path, { format: task.popc_format || "float32" });
    let total_pixels = popc_raster.data.length;
    let width = popc_raster.width;
    let height = popc_raster.height;

    let prob_rasters = {};
    let missing_probs = false;
    for (let i = 0; i < cohorts.length; i++) {
      let prob_path = path.join(logit_folder, `logit_${year}_class_${cohorts[i]}.png`);
      if (!fs.existsSync(prob_path)) { missing_probs = true; break; }
      prob_rasters[cohorts[i]] = await GeoPNG.loadNumberRasterImageAsync(prob_path, { format: "float32" });
    }
    if (missing_probs) return null;

    let num_cohorts = cohorts.length;
    let band_widths = new Float32Array(num_cohorts);
    for (let c = 0; c < num_cohorts; c++) {
      let cohort_name = cohorts[c];
      band_widths[c] = cohort_name.endsWith("_00") ? 1 : (cohort_name.endsWith("_01") ? 4 : 5);
    }

    let output_buffers = new Array(num_cohorts);
    for (let c = 0; c < num_cohorts; c++)
      output_buffers[c] = new Float32Array(total_pixels);

    let f_indices = [];
    let m_indices = [];
    for (let c = 0; c < num_cohorts; c++) {
      if (cohorts[c].startsWith("f_")) f_indices.push(c);
      else m_indices.push(c);
    }

    let age_count = f_indices.length;
    let age_band_widths = new Float32Array(age_count);
    for (let k = 0; k < age_count; k++)
      age_band_widths[k] = band_widths[f_indices[k]];

    // Pre-load HMD ground-truth rasters for pre-1950 historical years to bypass smoothing
    let has_hmd = false;
    let hmd_rasters = {};
    let hmd_total = null;
    if (year < 1950 && hmd_folder && fs.existsSync(hmd_folder)) {
      let test_path = path.join(hmd_folder, `global_${cohorts[0]}_${year}.png`);
      if (fs.existsSync(test_path)) {
        has_hmd = true;
        hmd_total = new Float32Array(total_pixels);
        for (let c = 0; c < num_cohorts; c++) {
          let hmd_path = path.join(hmd_folder, `global_${cohorts[c]}_${year}.png`);
          if (fs.existsSync(hmd_path)) {
            let r = await GeoPNG.loadNumberRasterImageAsync(hmd_path, { format: "float32" });
            hmd_rasters[cohorts[c]] = r;
            for (let i = 0; i < total_pixels; i++) {
              let val = r.data[i];
              if (val > 0) hmd_total[i] += val;
            }
          }
        }
      }
    }

    console.log(`[Worker PID ${process.pid}] Initialised task for Year ${year}: loaded popc (${width}x${height}) & ${num_cohorts} cohort rasters. Smoothing weight: ${wh_weight.toFixed(4)} (0=PAVA, 1=Whittaker).`);

    if (wh_weight <= 0.0) {
      // --- PURE PER-PIXEL ISOTONIC (PAVA) CLAMPING PATH ---
      console.log(`[Worker PID ${process.pid}] Year ${year}: Pass 1 (Per-pixel PAVA graduation)...`);

      let f_coupled_buf = new Float32Array(age_count);
      let m_coupled_buf = new Float32Array(age_count);
      let pava_buffers = {
        block_counts: new Int32Array(age_count),
        block_vals: new Float32Array(age_count),
        block_weights: new Float32Array(age_count),
        effective_weights: new Float32Array(age_count),
        output: new Float32Array(age_count),
        total_annualised: new Float32Array(age_count)
      };
      let raw_f = new Float32Array(age_count);
      let raw_m = new Float32Array(age_count);
      let tot_coupled_buf = new Float32Array(age_count);

      let smoothing_start = (task.smoothing_start_index !== undefined) ? task.smoothing_start_index : 2;

      for (let i = 0; i < total_pixels; i++) {
        let stade_pop = popc_raster.data[i];
        if (stade_pop < 0.01 || isNaN(stade_pop)) continue;

        if (has_hmd && hmd_total[i] > 0) {
          let hmd_scale = stade_pop / hmd_total[i];
          for (let c = 0; c < num_cohorts; c++) {
            let val = (hmd_rasters[cohorts[c]]) ? hmd_rasters[cohorts[c]].data[i] : 0;
            output_buffers[c][i] = val * hmd_scale;
          }
          continue;
        }

        for (let k = 0; k < age_count; k++) {
          let f_val = prob_rasters[cohorts[f_indices[k]]].data[i];
          let m_val = prob_rasters[cohorts[m_indices[k]]].data[i];

          raw_f[k] = (f_val > 0 && isFinite(f_val)) ? f_val : 0;
          raw_m[k] = (m_val > 0 && isFinite(m_val)) ? m_val : 0;
        }

        // Local monotonic ceiling for elderly cohorts (indices 14 to 17: 65, 70, 75, 80)
        for (let k = 14; k < age_count; k++) {
          let prev_f_dens = raw_f[k - 1] / age_band_widths[k - 1];
          let max_f_w = prev_f_dens * age_band_widths[k] * 1.05;
          if (raw_f[k] > max_f_w && max_f_w > 0) raw_f[k] = max_f_w;

          let prev_m_dens = raw_m[k - 1] / age_band_widths[k - 1];
          let max_m_w = prev_m_dens * age_band_widths[k] * 1.05;
          if (raw_m[k] > max_m_w && max_m_w > 0) raw_m[k] = max_m_w;
        }

        Statistics.coupleAgeSexCohorts(raw_m, raw_f, age_band_widths, (task.lift_isotonic || task.do_not_smooth) ? null : smoothing_start, {
          baseline_sex_ratios: task.baseline_sex_ratios,
          buffers: pava_buffers,
          do_not_smooth: task.do_not_smooth || task.lift_isotonic,
          female_output: f_coupled_buf,
          lift_isotonic: task.lift_isotonic,
          male_output: m_coupled_buf,
          preserve_sex_ratios: task.preserve_sex_ratios,
          total_output: tot_coupled_buf
        });

        if (!task.do_not_smooth && !task.lift_isotonic) {
          Statistics.pavaDecreasing(f_coupled_buf, age_band_widths, smoothing_start, { output: f_coupled_buf });
          Statistics.pavaDecreasing(m_coupled_buf, age_band_widths, smoothing_start, { output: m_coupled_buf });
        }

        let sum_rates = 0;
        for (let k = 0; k < age_count; k++)
          sum_rates += f_coupled_buf[k] + m_coupled_buf[k];

        if (sum_rates > 0) {
          let local_scale = stade_pop / sum_rates;
          for (let k = 0; k < age_count; k++) {
            output_buffers[f_indices[k]][i] = f_coupled_buf[k] * local_scale;
            output_buffers[m_indices[k]][i] = m_coupled_buf[k] * local_scale;
          }
        } else {
          let even_share = stade_pop / num_cohorts;
          for (let c = 0; c < num_cohorts; c++)
            output_buffers[c][i] = even_share;
        }
      }
    } else {
      // --- ISO3 COUNTRY PYRAMID GRADUATION (WHITTAKER-HENDERSON / TRANSITION) ---
      let geocodes_raster_path = task.geocodes_raster_path || path.join(global.h1 || "./histmap/1.data_raw/", "admin_modern/geocodes.png");
      let geocodes_csv_path = task.geocodes_csv_path || path.join(global.h1 || "./histmap/1.data_raw/", "admin_modern/geocodes.csv");

    if (!GeoPNG._cached_geocodes_index && fs.existsSync(geocodes_raster_path) && fs.existsSync(geocodes_csv_path)) {
      let csv_content = fs.readFileSync(geocodes_csv_path, "utf8");
      let lines = csv_content.split(/\r?\n/).filter(l => l.trim().length > 0);
      let all_iso = [];
      let color_to_iso_id = new Map();

      for (let i = 1; i < lines.length; i++) {
        let parts = lines[i].split(";");
        let iso3 = parts[0].trim();
        let color = parts[4] ? parts[4].trim() : null;
        if (color) {
          let cparts = color.split(",").map(Number);
          let key = (cparts[0] << 16) | (cparts[1] << 8) | cparts[2];
          let id = all_iso.indexOf(iso3);
          if (id === -1) {
            id = all_iso.length;
            all_iso.push(iso3);
          }
          color_to_iso_id.set(key, id);
        }
      }

      let geocodes_raster = GeoPNG.loadImage(geocodes_raster_path);
      let pixel_iso_ids = new Int16Array(total_pixels);
      pixel_iso_ids.fill(-1);

      for (let i = 0; i < total_pixels; i++) {
        let b = i * 4;
        let key = (geocodes_raster.data[b] << 16) | (geocodes_raster.data[b+1] << 8) | geocodes_raster.data[b+2];
        let id = color_to_iso_id.get(key);
        if (id !== undefined) pixel_iso_ids[i] = id;
      }

      GeoPNG._cached_geocodes_index = {
        all_iso: all_iso,
        pixel_iso_ids: pixel_iso_ids
      };
    }

    let all_iso = (GeoPNG._cached_geocodes_index) ? GeoPNG._cached_geocodes_index.all_iso : [];
    let pixel_iso_ids = (GeoPNG._cached_geocodes_index) ? GeoPNG._cached_geocodes_index.pixel_iso_ids : null;
    let num_bins = all_iso.length + 1; // Last bin is unmapped/fallback
    let fallback_bin_id = num_bins - 1;

    console.log(`[Worker PID ${process.pid}] Year ${year}: Pass 1 (Accumulating cohorts into ${num_bins} ISO3 bins)...`);

    let bin_raw_f = new Array(num_bins);
    let bin_raw_m = new Array(num_bins);
    let bin_scale_f = new Array(num_bins);
    let bin_scale_m = new Array(num_bins);

    for (let b = 0; b < num_bins; b++) {
      bin_raw_f[b] = new Float32Array(age_count);
      bin_raw_m[b] = new Float32Array(age_count);
      bin_scale_f[b] = new Float32Array(age_count);
      bin_scale_m[b] = new Float32Array(age_count);
      bin_scale_f[b].fill(1);
      bin_scale_m[b].fill(1);
    }

    // Pass 1: Accumulate raw cohort populations into ISO3 bins
    for (let i = 0; i < total_pixels; i++) {
      let stade_pop = popc_raster.data[i];
      if (stade_pop < 0.01 || isNaN(stade_pop)) continue;
      if (has_hmd && hmd_total[i] > 0) continue;

      let b_id = (pixel_iso_ids && pixel_iso_ids[i] >= 0) ? pixel_iso_ids[i] : fallback_bin_id;
      let raw_f_b = bin_raw_f[b_id];
      let raw_m_b = bin_raw_m[b_id];

      for (let k = 0; k < age_count; k++) {
        let f_val = prob_rasters[cohorts[f_indices[k]]].data[i];
        let m_val = prob_rasters[cohorts[m_indices[k]]].data[i];

        if (f_val > 0 && isFinite(f_val)) raw_f_b[k] += f_val * stade_pop;
        if (m_val > 0 && isFinite(m_val)) raw_m_b[k] += m_val * stade_pop;
      }
    }

    console.log(`[Worker PID ${process.pid}] Year ${year}: Pass 2 (Graduating ${num_bins} ISO3 country pyramids, Whittaker weight: ${wh_weight.toFixed(4)})...`);

    let enforce_fixed = (task.enforce_fixed_sex_ratios === true);
    let enforce_bounds = (task.enforce_biological_sex_ratios === true);
    let preserve_sex_ratios = (task.preserve_sex_ratios !== undefined) ? task.preserve_sex_ratios : !enforce_fixed && !enforce_bounds;
    let smoothing_start_idx = (task.lift_isotonic || task.do_not_smooth) ? null : ((task.smoothing_start_index !== undefined) ? task.smoothing_start_index : 2);
    let graduated_count = 0;

    let pava_buf_f = (wh_weight < 1.0) ? new Float32Array(age_count) : null;
    let pava_buf_m = (wh_weight < 1.0) ? new Float32Array(age_count) : null;
    let pava_buf_tot = (wh_weight < 1.0) ? new Float32Array(age_count) : null;

    let wh_buf_f = (wh_weight > 0.0) ? new Float32Array(age_count) : null;
    let wh_buf_m = (wh_weight > 0.0) ? new Float32Array(age_count) : null;
    let wh_buf_tot = (wh_weight > 0.0) ? new Float32Array(age_count) : null;

    for (let b = 0; b < num_bins; b++) {
      let bin_pop = 0;
      for (let k = 0; k < age_count; k++)
        bin_pop += bin_raw_f[b][k] + bin_raw_m[b][k];

      if (bin_pop <= 0) continue;

      let pava_scale_f = null;
      let pava_scale_m = null;

      // 1. Compute PAVA scales for country bin b if needed (pre-CDT / transition)
      if (wh_weight < 1.0) {
        Statistics.coupleAgeSexCohorts(
          bin_raw_m[b],
          bin_raw_f[b],
          age_band_widths,
          smoothing_start_idx,
          {
            baseline_sex_ratios: task.baseline_sex_ratios,
            do_not_smooth: task.do_not_smooth || task.lift_isotonic,
            enforce_biological_sex_ratios: enforce_bounds,
            enforce_fixed_sex_ratios: enforce_fixed,
            female_output: pava_buf_f,
            lift_isotonic: task.lift_isotonic,
            male_output: pava_buf_m,
            preserve_sex_ratios: preserve_sex_ratios,
            sex_ratio_bounds: task.sex_ratio_bounds,
            total_output: pava_buf_tot
          }
        );

        pava_scale_f = new Float32Array(age_count);
        pava_scale_m = new Float32Array(age_count);
        for (let k = 0; k < age_count; k++) {
          pava_scale_f[k] = (bin_raw_f[b][k] > 0) ? (pava_buf_f[k] / bin_raw_f[b][k]) : 1;
          pava_scale_m[k] = (bin_raw_m[b][k] > 0) ? (pava_buf_m[k] / bin_raw_m[b][k]) : 1;
        }
      }

      let wh_scale_f = null;
      let wh_scale_m = null;

      // 2. Compute Whittaker-Henderson scales for country bin b if needed (post-CDT / transition)
      if (wh_weight > 0.0) {
        Statistics.coupleAgeSexCohortsWhittaker(
          bin_raw_m[b],
          bin_raw_f[b],
          age_band_widths,
          smoothing_start_idx,
          {
            baseline_sex_ratios: task.baseline_sex_ratios,
            do_not_smooth: task.do_not_smooth || task.lift_isotonic,
            enforce_biological_sex_ratios: enforce_bounds,
            enforce_fixed_sex_ratios: enforce_fixed,
            female_output: wh_buf_f,
            graduate_sex_ratios: (task.graduate_sex_ratios !== undefined) ? task.graduate_sex_ratios : true,
            huber_delta: task.wh_huber_delta,
            lambda: task.wh_lambda,
            male_output: wh_buf_m,
            max_iterations: task.wh_max_iterations || 200,
            mu: (task.wh_mu !== undefined) ? task.wh_mu : 5000.0,
            preserve_sex_ratios: preserve_sex_ratios,
            preserve_total: true,
            sex_ratio_bounds: task.sex_ratio_bounds,
            sex_ratio_lambda: (task.wh_sex_ratio_lambda !== undefined) ? task.wh_sex_ratio_lambda : 20.0,
            tolerance: task.wh_tolerance || 1e-5,
            total_output: wh_buf_tot,
            weights: task.wh_weights
          }
        );

        wh_scale_f = new Float32Array(age_count);
        wh_scale_m = new Float32Array(age_count);
        for (let k = 0; k < age_count; k++) {
          wh_scale_f[k] = (bin_raw_f[b][k] > 0) ? (wh_buf_f[k] / bin_raw_f[b][k]) : 1;
          wh_scale_m[k] = (bin_raw_m[b][k] > 0) ? (wh_buf_m[k] / bin_raw_m[b][k]) : 1;
        }
      }

      // 3. Set country bin scales: pure PAVA, pure Whittaker, or smooth convex blend
      for (let k = 0; k < age_count; k++) {
        if (wh_weight <= 0.0) {
          bin_scale_f[b][k] = pava_scale_f[k];
          bin_scale_m[b][k] = pava_scale_m[k];
        } else if (wh_weight >= 1.0) {
          bin_scale_f[b][k] = wh_scale_f[k];
          bin_scale_m[b][k] = wh_scale_m[k];
        } else {
          bin_scale_f[b][k] = (1.0 - wh_weight) * pava_scale_f[k] + wh_weight * wh_scale_f[k];
          bin_scale_m[b][k] = (1.0 - wh_weight) * pava_scale_m[k] + wh_weight * wh_scale_m[k];
        }
      }

      graduated_count++;
    }

    console.log(`[Worker PID ${process.pid}] Year ${year}: Graduated ${graduated_count} ISO3 country bins (Whittaker weight: ${wh_weight.toFixed(4)}). Starting Pass 3 (Dasymetric pixel allocation)...`);

    // Pre-calculate target aggregates that we MUST match
    let target_f = new Array(num_bins);
    let target_m = new Array(num_bins);
    for (let b = 0; b < num_bins; b++) {
      target_f[b] = new Float32Array(age_count);
      target_m[b] = new Float32Array(age_count);
      for (let k = 0; k < age_count; k++) {
        target_f[b][k] = bin_raw_f[b][k] * bin_scale_f[b][k];
        target_m[b][k] = bin_raw_m[b][k] * bin_scale_m[b][k];
      }
    }

    // Pass 3: Dasymetrically resolve pixel populations using 3-iteration IPF (RAS)
    const NUM_IPF_ITERATIONS = 3;
    for (let iter = 0; iter < NUM_IPF_ITERATIONS; iter++) {
      let is_final = (iter === NUM_IPF_ITERATIONS - 1);
      
      let current_sum_f = new Array(num_bins);
      let current_sum_m = new Array(num_bins);
      if (!is_final) {
        for (let b = 0; b < num_bins; b++) {
          current_sum_f[b] = new Float64Array(age_count);
          current_sum_m[b] = new Float64Array(age_count);
        }
      }

      for (let i = 0; i < total_pixels; i++) {
        let stade_pop = popc_raster.data[i];
        if (stade_pop < 0.01 || isNaN(stade_pop)) continue;

        if (has_hmd && hmd_total[i] > 0) {
          if (is_final) {
            let hmd_scale = stade_pop / hmd_total[i];
            for (let c = 0; c < num_cohorts; c++) {
              let val = (hmd_rasters[cohorts[c]]) ? hmd_rasters[cohorts[c]].data[i] : 0;
              output_buffers[c][i] = val * hmd_scale;
            }
          }
          continue;
        }

        let b_id = (pixel_iso_ids && pixel_iso_ids[i] >= 0) ? pixel_iso_ids[i] : fallback_bin_id;
        let scale_f = bin_scale_f[b_id];
        let scale_m = bin_scale_m[b_id];

        let sum_rates = 0;
        for (let k = 0; k < age_count; k++) {
          let f_val = prob_rasters[cohorts[f_indices[k]]].data[i];
          let m_val = prob_rasters[cohorts[m_indices[k]]].data[i];
          if (f_val > 0 && isFinite(f_val)) sum_rates += f_val * scale_f[k];
          if (m_val > 0 && isFinite(m_val)) sum_rates += m_val * scale_m[k];
        }

        if (sum_rates > 0) {
          let local_scale = stade_pop / sum_rates;
          for (let k = 0; k < age_count; k++) {
            let f_val = prob_rasters[cohorts[f_indices[k]]].data[i];
            let m_val = prob_rasters[cohorts[m_indices[k]]].data[i];

            let f_w = (f_val > 0 && isFinite(f_val)) ? f_val * scale_f[k] : 0;
            let m_w = (m_val > 0 && isFinite(m_val)) ? m_val * scale_m[k] : 0;

            if (is_final) {
              output_buffers[f_indices[k]][i] = f_w * local_scale;
              output_buffers[m_indices[k]][i] = m_w * local_scale;
            } else {
              current_sum_f[b_id][k] += f_w * local_scale;
              current_sum_m[b_id][k] += m_w * local_scale;
            }
          }
        } else if (is_final) {
          let even_share = stade_pop / num_cohorts;
          for (let c = 0; c < num_cohorts; c++)
            output_buffers[c][i] = even_share;
        }
      }
      
      // Scale correction (IPF Margin Match)
      if (!is_final) {
        for (let b = 0; b < num_bins; b++) {
          for (let k = 0; k < age_count; k++) {
            if (current_sum_f[b][k] > 0) bin_scale_f[b][k] *= (target_f[b][k] / current_sum_f[b][k]);
            if (current_sum_m[b][k] > 0) bin_scale_m[b][k] *= (target_m[b][k] / current_sum_m[b][k]);
          }
        }
      }
    }
  }

  if (!fs.existsSync(output_folder)) fs.mkdirSync(output_folder, { recursive: true });

    console.log(`[Worker PID ${process.pid}] Year ${year}: Pass 2 completed. Saving ${num_cohorts} clamped cohort rasters to disk...`);

    for (let c = 0; c < num_cohorts; c++) {
      let out_path = path.join(output_folder, `global_${cohorts[c]}_${year}.png`);
      await GeoPNG.saveNumberRasterImageAsync({
        data: output_buffers[c],
        file_path: out_path,
        format: "float32",
        height: height,
        width: width
      });
      console.log(`[Worker PID ${process.pid}] Year ${year}: Saved raster ${path.basename(out_path)} (${c + 1}/${num_cohorts})`);
    }

    console.log(`[Worker PID ${process.pid}] Year ${year}: All ${num_cohorts} rasters saved successfully.`);

    return { year: year, success: true };
  }

  //10. Clamp Professions
  if (task_type === "clamp_professions") {
    let age_sex_folder = task.age_sex_folder;
    let categories = task.categories || [];
    let lfpr_folder = task.lfpr_folder;
    let logit_folder = task.logit_rasters_folder;
    let olivetti_categories = task.olivetti_categories || [];
    let output_aggregates = task.output_aggregates;
    let output_percentages = task.output_percentages;
    let sexes = task.sexes || ["m", "f"];
    let working_cohorts = task.working_cohorts || [];
    let year = task.year;

    let agg_t = {};
    for (let i = 0; i < categories.length; i++) agg_t[categories[i]] = null;
    let pop_t = null;
    let width = 4320;
    let height = 2160;

    for (let s = 0; s < sexes.length; s++) {
      let sex = sexes[s];
      let lfpr_path = path.join(lfpr_folder, `lfpr_${sex}_${year}.png`);
      if (!fs.existsSync(lfpr_path)) continue;
      let lfpr_raster = await GeoPNG.loadNumberRasterImageAsync(lfpr_path, { format: "float32" });

      width = lfpr_raster.width;
      height = lfpr_raster.height;
      let data_len = lfpr_raster.data.length;
      let pop_raster = new Float32Array(data_len);

      for (let i = 0; i < working_cohorts.length; i++) {
        let cp = path.join(age_sex_folder, `${sex}_${working_cohorts[i]}_${year}.png`);
        if (!fs.existsSync(cp)) cp = path.join(age_sex_folder, `global_${sex}_${working_cohorts[i]}_${year}.png`);
        if (fs.existsSync(cp)) {
          let c_raster = await GeoPNG.loadNumberRasterImageAsync(cp, { format: "float32" });
          for (let j = 0; j < data_len; j++) {
            let val = c_raster.data[j];
            if (!isNaN(val) && val > 0) pop_raster[j] += val;
          }
        }
      }

      if (!pop_t) pop_t = new Float32Array(data_len);
      for (let i = 0; i < data_len; i++) pop_t[i] += pop_raster[i];

      let prob_rasters = {};
      let missing_probs = false;
      for (let i = 0; i < olivetti_categories.length; i++) {
        let p_path = path.join(logit_folder, `logit_${sex}_${year}_class_${olivetti_categories[i]}.png`);
        if (!fs.existsSync(p_path)) { missing_probs = true; break; }
        prob_rasters[olivetti_categories[i]] = await GeoPNG.loadNumberRasterImageAsync(p_path, { format: "float32" });
      }
      if (missing_probs) continue;

      let prob_sum_working = new Float32Array(data_len);
      for (let i = 0; i < olivetti_categories.length; i++) {
        let data = prob_rasters[olivetti_categories[i]].data;
        for (let j = 0; j < data_len; j++) {
          let val = data[j];
          if (!isNaN(val) && val > 0) prob_sum_working[j] += val;
        }
      }

      for (let i = 0; i < categories.length; i++) {
        let c = categories[i];
        if (!agg_t[c]) agg_t[c] = new Float32Array(data_len);

        let pct_arr = new Float32Array(data_len);
        let agg_arr = new Float32Array(data_len);
        let prob_data = prob_rasters[c] ? prob_rasters[c].data : null;

        for (let j = 0; j < data_len; j++) {
          let pop = pop_raster[j];
          if (pop <= 0) continue;

          let lfpr = lfpr_raster.data[j];
          if (isNaN(lfpr)) lfpr = 0;

          let final_pct = 0;
          if (c === "not_in_work") {
            final_pct = Math.max(0, 1.0 - lfpr);
          } else {
            let sum_w = prob_sum_working[j];
            let p_val = prob_data ? prob_data[j] : 0;
            if (isNaN(p_val) || p_val < 0) p_val = 0;

            if (sum_w <= 0) {
              final_pct = lfpr / olivetti_categories.length;
            } else {
              final_pct = lfpr * (p_val / sum_w);
            }
          }

          pct_arr[j] = final_pct;
          agg_arr[j] = final_pct * pop;
          agg_t[c][j] += agg_arr[j];
        }

        let ensureDir = (p) => { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); };
        ensureDir(output_percentages);
        ensureDir(output_aggregates);

        await GeoPNG.saveNumberRasterImageAsync({
          data: pct_arr,
          file_path: path.join(output_percentages, `${c}_${sex}_${year}.png`),
          format: "float32",
          height: height,
          width: width
        });
        await GeoPNG.saveNumberRasterImageAsync({
          data: agg_arr,
          file_path: path.join(output_aggregates, `${c}_${sex}_${year}.png`),
          format: "float32",
          height: height,
          width: width
        });
      }
    }

    if (pop_t) {
      for (let i = 0; i < categories.length; i++) {
        let c = categories[i];
        let pct_t = new Float32Array(pop_t.length);
        for (let j = 0; j < pop_t.length; j++) {
          if (pop_t[j] > 0) pct_t[j] = agg_t[c][j] / pop_t[j];
        }
        await GeoPNG.saveNumberRasterImageAsync({
          data: pct_t,
          file_path: path.join(output_percentages, `${c}_t_${year}.png`),
          format: "float32",
          height: height,
          width: width
        });
        await GeoPNG.saveNumberRasterImageAsync({
          data: agg_t[c],
          file_path: path.join(output_aggregates, `${c}_t_${year}.png`),
          format: "float32",
          height: height,
          width: width
        });
      }
    }

    return { year: year, success: true };
  }

  //11. Aggregate Areal Covariates for Demography / Classifiers
  if (task_type === "aggregate_areal_covariates") {
    let year = task.year;
    let keys = task.keys || [];
    let geocode_path = task.geocode_path;
    let population_path = task.population_path;
    let population_format = task.population_format || "float32";
    let covariate_paths = task.covariate_paths || {};
    let colour_lookup = task.colour_lookup_packed || {};

    if (!population_path || !fs.existsSync(population_path)) return {};

    //Cache geocode raster across worker tasks
    if (!global._cached_geocodes_raster || global._cached_geocodes_path !== geocode_path) {
      if (fs.existsSync(geocode_path)) {
        global._cached_geocodes_raster = GeoPNG.loadImage(geocode_path);
        global._cached_geocodes_path = geocode_path;
      }
    }
    let geocode_raster = global._cached_geocodes_raster;
    if (!geocode_raster) return {};

    //Build fast Map for packed colours
    let colour_map = new Map();
    if (Array.isArray(colour_lookup)) {
      for (let i = 0; i < colour_lookup.length; i++)
        colour_map.set(colour_lookup[i][0], colour_lookup[i][1]);
    } else {
      let entries = Object.entries(colour_lookup);
      for (let i = 0; i < entries.length; i++)
        colour_map.set(Number(entries[i][0]), entries[i][1]);
    }

    let pop_raster = await GeoPNG.loadNumberRasterImageAsync(population_path, { format: population_format });
    let total_pixels = pop_raster.data.length;

    let cov_rasters = {};
    for (let k = 0; k < keys.length; k++) {
      let key = keys[k];
      if (covariate_paths[key] && fs.existsSync(covariate_paths[key].path)) {
        cov_rasters[key] = await GeoPNG.loadNumberRasterImageAsync(covariate_paths[key].path, {
          format: covariate_paths[key].format || "float32"
        });
      }
    }

    let aggregates = {};
    let geocode_data = geocode_raster.data;
    let pop_data = pop_raster.data;

    for (let i = 0; i < total_pixels; i++) {
      let pop = pop_data[i];
      if (pop <= 0 || isNaN(pop)) continue;

      let b_idx = i * 4;
      let packed = (geocode_data[b_idx] << 16) | (geocode_data[b_idx + 1] << 8) | geocode_data[b_idx + 2];
      let geocode = colour_map.get(packed);
      if (!geocode) continue;

      let agg = aggregates[geocode];
      if (!agg) {
        agg = { population: 0, sums: {} };
        for (let k = 0; k < keys.length; k++) agg.sums[keys[k]] = 0;
        aggregates[geocode] = agg;
      }

      agg.population += pop;
      for (let k = 0; k < keys.length; k++) {
        let r = cov_rasters[keys[k]];
        if (r) {
          let val = r.data[i];
          if (isFinite(val)) agg.sums[keys[k]] += val * pop;
        }
      }
    }

    //Compute normalised features per geocode
    let geocode_keys = Object.keys(aggregates);
    for (let i = 0; i < geocode_keys.length; i++) {
      let geocode = geocode_keys[i];
      let agg = aggregates[geocode];
      agg.features = {};
      for (let k = 0; k < keys.length; k++) {
        let key = keys[k];
        agg.features[key] = agg.population > 0 ? agg.sums[key] / agg.population : 0;
      }
      delete agg.sums;

      let local_urban = agg.features.urbc_ || 0;
      let local_rural = agg.features.rurc_ || 0;
      let local_total = local_urban + local_rural || agg.features.popc_ || agg.population;
      agg.features.urban_share = local_total > 0 ? local_urban / local_total : 0;
      agg.features.log_population_density = Math.log(Math.max(0.01, agg.features.popd_ || 0));
      agg.features.log_gdp_ppp_pc = Math.log(Math.max(1, agg.features.gdp_ppp_pc || 0));
      agg.features.year_scaled = year / 1000;
    }

    return aggregates;
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
