if (!global.GeoPNG) global.GeoPNG = {};
if (!global.GeoPNG.tasks) global.GeoPNG.tasks = {};

//Initialise machine learning and regression tasks
{
  /**
   * Generates ALR compositional prediction raster.
   * 
   * @param {Object} arg0_task
   *  @param {Object} arg0_task.covariates_map - Covariates map.
   *  @param {Object} arg0_task.model_obj - Trained ALR model object.
   *  @param {Object} [arg0_task.options={}] - Generation options.
   *  @param {string} arg0_task.output_file_path - Output path.
   * 
   * @returns {Promise<Object>}
   */
  GeoPNG.tasks.generate_alr_raster = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
    let covariates_map = task.covariates_map;
    let model_obj = task.model_obj;
    let opt = task.options || {};
    let output_file_path = task.output_file_path;

    await Statistics.generateALRRaster(output_file_path, {
      mask_uninhabited: (opt.mask_uninhabited !== undefined) ? opt.mask_uninhabited : true,
      ...opt,
      covariates_obj: covariates_map,
      model_obj: model_obj
    });

    //Return statement
    return { output_file_path: output_file_path, success: true };
  };


  /**
   * Generates Multinomial Logit prediction raster.
   * 
   * @param {Object} arg0_task
   *  @param {Object} arg0_task.covariates_map - Map of covariate paths.
   *  @param {Object} arg0_task.model_obj - Trained model object.
   *  @param {Object} [arg0_task.options={}] - Options.
   *  @param {string} arg0_task.output_file_path - Target output raster.
   * 
   * @returns {Promise<Object>}
   */
  GeoPNG.tasks.generate_multinomial_raster = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
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

    //Return statement
    return { output_file_path: output_file_path, success: true };
  };


  /**
   * Generates OLS continuous prediction raster.
   * 
   * @param {Object} arg0_task
   *  @param {Object} arg0_task.covariates_map - Map of covariate paths.
   *  @param {Object} arg0_task.model_obj - Trained OLS model object.
   *  @param {Object} [arg0_task.options={}] - Generation options.
   *  @param {string} arg0_task.output_file_path - Target output raster.
   * 
   * @returns {Promise<Object>}
   */
  GeoPNG.tasks.generate_ols_raster = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
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

    //Return statement
    return { output_file_path: output_file_path, success: true };
  };


  /**
   * Generates SuperLearner prediction raster ensemble.
   * 
   * @param {Object} arg0_task
   *  @param {Object} arg0_task.covariates_map - Covariates map.
   *  @param {Object} [arg0_task.options={}] - Execution options.
   *  @param {string} arg0_task.output_file_path - Output file path template.
   *  @param {Object} arg0_task.resolved_models - Map of category to model configs.
   *  @param {string} [arg0_task.sex] - Sex identifier.
   *  @param {number} [arg0_task.year] - Year identifier.
   * 
   * @returns {Promise<Object>}
   */
  GeoPNG.tasks.generate_superlearner_raster = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
    let covariates_map = task.covariates_map;
    let opt = task.options || {};
    let output_file_path = task.output_file_path;
    let task_sex = task.sex ? task.sex.toUpperCase() : "";
    let task_year = (task.year !== undefined) ? task.year : "";

    let { rasters_obj, valid_keys } = Statistics.loadCovariateRasters(covariates_map);

    let data_len = rasters_obj[valid_keys[0]].data.length;
    let height = rasters_obj[valid_keys[0]].height;
    let output_arrays = {};
    let width = rasters_obj[valid_keys[0]].width;

    let num_valid_keys = valid_keys.length;
    let feature_arrays = [];
    for (let j = 0; j < num_valid_keys; j++)
      feature_arrays.push(rasters_obj[valid_keys[j]].data);

    let key_to_valid_idx = {};
    for (let k = 0; k < num_valid_keys; k++) key_to_valid_idx[valid_keys[k]] = k;

    if (!global._superlearner_model_cache) global._superlearner_model_cache = {};
    let model_cache = global._superlearner_model_cache;

    function loadModelCached (file_path) {
      if (!model_cache[file_path])
        model_cache[file_path] = JSON.parse(fs.readFileSync(file_path, "utf8"));
      return model_cache[file_path];
    }

    function prepareCategoryEnsemble (model_conf) {
      let all_feature_keys = {};
      let models_list = [];

      if (model_conf.type === "superlearner_ensemble") {
        for (let m = 0; m < model_conf.models.length; m++) {
          let m_obj = loadModelCached(model_conf.models[m].model);
          (m_obj.keys || []).forEach(k => all_feature_keys[k] = true);
          models_list.push({ obj: m_obj, weight: model_conf.models[m].weight });
        }
      } else {
        let m_obj = loadModelCached(model_conf);
        (m_obj.keys || []).forEach(k => all_feature_keys[k] = true);
        models_list.push({ obj: m_obj, weight: 1.0 });
      }

      let union_keys = Object.keys(all_feature_keys);
      let num_features = union_keys.length;
      let feature_valid_indices = new Int32Array(num_features);
      for (let k = 0; k < num_features; k++) {
        let k_name = union_keys[k];
        feature_valid_indices[k] = (key_to_valid_idx[k_name] !== undefined) ? key_to_valid_idx[k_name] : -1;
      }

      let combined_coeffs = new Float64Array(num_features);
      let combined_intercept = 0;
      for (let m = 0; m < models_list.length; m++) {
        let coeffs = (models_list[m].obj.linear_model && models_list[m].obj.linear_model.coefficients) || {};
        let intercept = (models_list[m].obj.linear_model && models_list[m].obj.linear_model.intercept) || 0;
        let m_obj = models_list[m].obj;
        let W_m = models_list[m].weight;
        let w_lin = (m_obj.weights && m_obj.weights.linear !== undefined) ? m_obj.weights.linear : 0.5;

        combined_intercept += W_m * w_lin * intercept;
        for (let k = 0; k < num_features; k++) {
          let c = coeffs[union_keys[k]];
          if (typeof c === "number" && !isNaN(c)) combined_coeffs[k] += W_m * w_lin * c;
        }
      }

      let sorted_models = [...models_list].sort((a, b) => b.weight - a.weight);
      let top_models = sorted_models.slice(0, 12);
      let rf_weight_sum = top_models.reduce((sum, entry) => sum + entry.weight, 0);

      let flat_trees = [];
      for (let m = 0; m < top_models.length; m++) {
        let m_entry = top_models[m];
        let m_obj = m_entry.obj;
        let trees = (m_obj.rf_model && m_obj.rf_model.trees) || [];
        let W_norm = (rf_weight_sum > 0) ? (m_entry.weight / rf_weight_sum) : (1 / top_models.length);
        let w_rf = (m_obj.weights && m_obj.weights.rf !== undefined) ? m_obj.weights.rf : 0.5;

        if (trees.length > 0) {
          let scale = (W_norm * w_rf) / trees.length;
          for (let t = 0; t < trees.length; t++) flat_trees.push({ tree: trees[t], weight: scale });
        }
      }

      return {
        combined_coeffs: combined_coeffs,
        combined_intercept: combined_intercept,
        feature_valid_indices: feature_valid_indices,
        flat_trees: flat_trees,
        num_features: num_features
      };
    }

    function evaluateCategoryEnsemble (prep, feat_arrs, idx, x_buf) {
      let lin_val = prep.combined_intercept;
      for (let k = 0; k < prep.num_features; k++) {
        let v_idx = prep.feature_valid_indices[k];
        let val = (v_idx >= 0) ? feat_arrs[v_idx][idx] : 0;
        x_buf[k] = val;
        lin_val += val * prep.combined_coeffs[k];
      }

      let n_trees = prep.flat_trees.length;
      let rf_val = 0;
      for (let t = 0; t < n_trees; t++) {
        let node = prep.flat_trees[t].tree;
        while (!node.is_leaf) {
          node = (x_buf[node.feature_index] <= node.threshold) ? node.left : node.right;
        }
        rf_val += node.value * prep.flat_trees[t].weight;
      }

      return lin_val + rf_val;
    }

    let keys = Object.keys(task.resolved_models);
    let num_cats = keys.length;
    let prepared_categories = {};

    for (let i = 0; i < num_cats; i++) {
      let cat = keys[i];
      output_arrays[cat] = new Float32Array(data_len);
      prepared_categories[cat] = prepareCategoryEnsemble(task.resolved_models[cat]);
    }

    let mask_uninhabited = (opt.mask_uninhabited !== undefined) ? opt.mask_uninhabited : true;
    let popc_idx = key_to_valid_idx["popc_"];
    let popc_arr = (popc_idx !== undefined) ? feature_arrays[popc_idx] : null;
    let popd_idx = key_to_valid_idx["popd_"];
    let popd_arr = (popd_idx !== undefined) ? feature_arrays[popd_idx] : null;

    let p_vals = new Float64Array(num_cats);
    let x_buf = new Float64Array(100);

    for (let i = 0; i < data_len; i++) {
      if (mask_uninhabited) {
        let pop = (popd_arr ? popd_arr[i] : 0) || (popc_arr ? popc_arr[i] : 0);
        if (isNaN(pop) || pop <= 0) {
          for (let j = 0; j < num_cats; j++) output_arrays[keys[j]][i] = 0;
          continue;
        }
      }

      let is_valid = true;
      for (let j = 0; j < num_valid_keys; j++) {
        let v = feature_arrays[j][i];
        if (isNaN(v)) { is_valid = false; break; }
      }

      if (is_valid) {
        let sum_p = 0;

        for (let j = 0; j < num_cats; j++) {
          let cat = keys[j];
          let logit_val = evaluateCategoryEnsemble(prepared_categories[cat], feature_arrays, i, x_buf);
          let p = Math.exp(logit_val) / (1 + Math.exp(logit_val));
          p_vals[j] = p;
          sum_p += p;
        }

        for (let j = 0; j < num_cats; j++) {
          let cat = keys[j];
          output_arrays[cat][i] = (sum_p > 0) ? (p_vals[j] / sum_p) : 0;
        }
      } else {
        for (let j = 0; j < num_cats; j++) output_arrays[keys[j]][i] = NaN;
      }
    }

    for (let i = 0; i < keys.length; i++) {
      let cat = keys[i];
      let file_path = output_file_path.replace(".png", `_class_${cat}.png`);
      GeoPNG.saveNumberRasterImage({
        file_path: file_path,
        format: "float32",
        height: height,
        width: width,
        function: (idx) => output_arrays[cat][idx]
      });
    }

    //Return statement
    return { output_file_path: output_file_path, success: true };
  };


  /**
   * Predicts raster using trained regression models.
   * 
   * @param {Object} arg0_task
   *  @param {string} arg0_task.output_file_path
   *  @param {Object} arg0_task.model
   *  @param {Object} [arg0_task.options]
   * 
   * @returns {Promise<any>}
   */
  GeoPNG.tasks.predict_raster = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Return statement
    return await Statistics.LearningFramework.predictRaster(
      task.output_file_path,
      task.model,
      task.options
    );
  };


  /**
   * Trains ALR compositional demographic model.
   * 
   * @param {Object} arg0_task
   *  @param {string[]} arg0_task.categories
   *  @param {Object} arg0_task.covariates_map
   *  @param {string} arg0_task.model_path
   *  @param {Object} [arg0_task.options]
   *  @param {string} [arg0_task.reference_category]
   *  @param {Object} arg0_task.target_paths
   * 
   * @returns {Promise<Object|null>}
   */
  GeoPNG.tasks.train_alr_model = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
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

      let inv_total = 1 / total_pop;
      let prop_row = new Float32Array(categories.length);
      for (let j = 0; j < categories.length; j++)
        prop_row[j] = cat_pops[j] * inv_total;

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

    //Return statement
    return { model_path: model_path, success: !!model };
  };


  /**
   * Trains Multinomial Logit Model on raster categories and covariates.
   * 
   * @param {Object} arg0_task
   *  @param {string[]} arg0_task.categories
   *  @param {Object} arg0_task.covariates_map
   *  @param {string} arg0_task.model_path
   *  @param {Object} [arg0_task.options]
   *  @param {Object} arg0_task.target_paths
   * 
   * @returns {Promise<Object>}
   */
  GeoPNG.tasks.train_multinomial_logit = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
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
    let weights = [];
    let X = [];
    let Y = [];

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

      let inv_total = 1 / total_pop;
      let prop_row = new Float32Array(categories.length);
      for (let j = 0; j < categories.length; j++)
        prop_row[j] = cat_pops[j] * inv_total;

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

    //Return statement
    return { model_path: model_path, sample_count: X.length, success: !!model };
  };


  /**
   * Trains OLS model on continuous raster target & covariates.
   * 
   * @param {Object} arg0_task
   *  @param {Object} arg0_task.covariates_map
   *  @param {Object} [arg0_task.options]
   *  @param {string} arg0_task.output_file_path
   *  @param {string} arg0_task.target_file_path
   *  @param {string} [arg0_task.target_format="float32"]
   * 
   * @returns {Promise<Object>}
   */
  GeoPNG.tasks.train_ols = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
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

    //Return statement
    return {
      key: options.key,
      output_file_path: output_file_path,
      sample_count: loaded_obj.X.length,
      success: true
    };
  };


  /**
   * Trains OLS model on point dataset and covariates.
   * 
   * @param {Object} arg0_task
   *  @param {Object} arg0_task.covariates_map
   *  @param {Object} [arg0_task.options]
   *  @param {string} arg0_task.output_file_path
   *  @param {Array} arg0_task.points
   *  @param {number} arg0_task.target_year
   * 
   * @returns {Promise<Object>}
   */
  GeoPNG.tasks.train_ols_points = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
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

    //Return statement
    return {
      key: options.key,
      output_file_path: output_file_path,
      sample_count: dataset.X.length,
      success: true
    };
  };


  /**
   * Trains SuperLearner model.
   * 
   * @param {Object} arg0_task
   *  @param {string} arg0_task.cat
   *  @param {string[]} arg0_task.categories
   *  @param {Object} arg0_task.covariates_map
   *  @param {string} arg0_task.model_path
   *  @param {Object} [arg0_task.options]
   *  @param {Object} arg0_task.target_paths
   *  @param {number} arg0_task.year
   * 
   * @returns {Promise<Object|null>}
   */
  GeoPNG.tasks.train_superlearner_model = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
    let categories = task.categories || [];
    let covariates_map = task.covariates_map || {};
    let model_path = path.resolve(task.model_path);
    let opt = task.options || {};
    let target_paths = task.target_paths || {};

    let { rasters_obj, valid_keys } = Statistics.loadCovariateRasters(covariates_map);
    let target_rasters = {};
    for (let i = 0; i < categories.length; i++) {
      let c = categories[i];
      let p = target_paths[c];
      if (!p || !fs.existsSync(p)) {
        console.error(`[GeoWorker] Missing target path: ${p}`);
        return null;
      }
      target_rasters[c] = GeoPNG.loadNumberRasterImage(p, { format: "float32" });
    }

    let data_len = target_rasters[categories[0]].data.length;
    let X = [];
    let Y = [];
    for (let i = 0; i < data_len; i++) {
      let cat_pops = [];
      let this_cat_pop = target_rasters[task.cat].data[i];
      let total_pop = 0;
      this_cat_pop = (isNaN(this_cat_pop) || this_cat_pop < 0) ? 0 : this_cat_pop;

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
        let val = rasters_obj[valid_keys[j]].data[i];
        if (isNaN(val)) { is_valid = false; break; }
        x_row.push(val);
      }
      if (!is_valid) continue;

      let p = this_cat_pop / total_pop;
      p = Math.max(0.001, Math.min(0.999, p));
      let logit = Math.log(p / (1 - p));

      X.push(x_row);
      Y.push(logit);
    }
    if (X.length === 0) {
      console.error(`[GeoWorker] X array was empty for ${task.cat} / ${task.year}.`);
      return null;
    }

    let max_samples = 5000;
    if (X.length > max_samples) {
      let sampled_X = [];
      let sampled_Y = [];
      let step = X.length / max_samples;
      for (let i = 0; i < max_samples; i++) {
        let idx = Math.floor(i * step + Math.random() * step);
        if (idx >= X.length) idx = X.length - 1;
        sampled_X.push(X[idx]);
        sampled_Y.push(Y[idx]);
      }
      X = sampled_X;
      Y = sampled_Y;
    }

    let model = await Statistics.trainSuperlearner(model_path, {
      keys: valid_keys,
      X: X,
      Y: Y
    }, {
      linear_options: { fit_intercept: true, lambda: Math.returnSafeNumber(opt.lambda, 1e-4) },
      rf_options: { max_depth: 8, min_samples_split: 5, n_trees: 15 }
    });

    //Return statement
    return { model_path: model_path, success: !!model };
  };
}
