if (!global.GeoPNG) global.GeoPNG = {};
if (!global.GeoPNG.tasks) global.GeoPNG.tasks = {};

//Initialise interpolation and aggregation tasks
{
  /**
   * Aggregates areal covariates per geocode region using population weights.
   * 
   * @param {Object} arg0_task
   *  @param {string} arg0_task.geocode_path - Path to RGB geocodes raster.
   *  @param {string} arg0_task.population_path - Path to population raster.
   *  @param {string} [arg0_task.population_format="float32"] - Population format.
   *  @param {string[]} arg0_task.keys - Covariate keys to aggregate.
   *  @param {Object} arg0_task.covariate_paths - Map of covariate paths.
   *  @param {Object|Array} arg0_task.colour_lookup_packed - Colour integer lookup table.
   *  @param {number} arg0_task.year - Year of analysis.
   * 
   * @returns {Promise<Object>}
   */
  GeoPNG.tasks.aggregate_areal_covariates = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
    let colour_lookup = task.colour_lookup_packed || {};
    let covariate_paths = task.covariate_paths || {};
    let geocode_path = task.geocode_path;
    let keys = task.keys || [];
    let population_format = task.population_format || "float32";
    let population_path = task.population_path;
    let year = task.year;

    //Guard clause
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

    //Return statement
    return aggregates;
  };


  /**
   * Applies areal timeseries clamping to raster pixels based on target masks and weights.
   * 
   * @param {Object} arg0_task
   *  @param {Object} arg0_task.areal_indexing - Areal index metadata.
   *  @param {string} [arg0_task.format="float32"] - Format of output raster.
   *  @param {string} arg0_task.input_path - Source raster file path.
   *  @param {string} [arg0_task.mode] - Clamping mode.
   *  @param {string} arg0_task.output_path - Output file path.
   *  @param {Object} arg0_task.targets - Target values.
   *  @param {Object} [arg0_task.weights] - Weight multipliers.
   * 
   * @returns {Promise<string|null>}
   */
  GeoPNG.tasks.areal_clamping = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
    let indexing = task.areal_indexing;
    let input_path = task.input_path;
    let output_path = task.output_path;

    //Guard clause
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

    //Return statement
    return output_path;
  };


  /**
   * Interpolates WID raster with missing data fallback.
   * 
   * @param {Object} arg0_task
   *  @param {string} arg0_task.brushed_target_path - Brushed end-state raster.
   *  @param {string} arg0_task.clamped_source - Clamped historical source raster.
   *  @param {number[]} [arg0_task.interp_domain=[1700, 1800]] - Domain boundary years.
   *  @param {string} arg0_task.output_path - Output file path.
   *  @param {string} arg0_task.source_path - Baseline OLS source raster.
   *  @param {number} arg0_task.year - Target year.
   * 
   * @returns {Promise<string>}
   */
  GeoPNG.tasks.interpolate_wid_raster = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
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

    //Return statement
    return output_path;
  };


  /**
   * Executes linear raster interpolation between two years.
   * 
   * @param {Object} arg0_task
   *  @param {string} arg0_task.from_file_path - Baseline year raster.
   *  @param {string} arg0_task.to_file_path - Target year raster.
   *  @param {string} arg0_task.output_file_path - Resulting interpolated raster.
   *  @param {Object} [arg0_task.options] - Interpolation options.
   * 
   * @returns {Promise<string>}
   */
  GeoPNG.tasks.linear_interpolation = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    GeoPNG.linearInterpolation(
      task.from_file_path,
      task.to_file_path,
      task.output_file_path,
      task.options
    );

    //Return statement
    return task.output_file_path;
  };
}
