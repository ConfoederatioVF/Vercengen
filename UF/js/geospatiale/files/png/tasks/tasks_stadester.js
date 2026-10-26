if (!global.GeoPNG) global.GeoPNG = {};
if (!global.GeoPNG.tasks) global.GeoPNG.tasks = {};

//Initialise Stadester population and scaling tasks
{
  /**
   * Clamps demographic cohorts to Stadester population totals.
   * 
   * @param {Object} arg0_task
   *  @param {string[]} [arg0_task.cohorts=[]] - List of cohort keys.
   *  @param {string} arg0_task.logit_rasters_folder - Folder containing logit probability rasters.
   *  @param {string} arg0_task.output_folder - Destination folder for clamped rasters.
   *  @param {string} [arg0_task.popc_format="float32"] - Population raster format.
   *  @param {string} arg0_task.popc_path - Path to reference population raster.
   *  @param {number} arg0_task.year - Target year.
   * 
   * @returns {Promise<Object|null>}
   */
  GeoPNG.tasks.clamp_cohorts_to_stadester = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
    let cohorts = task.cohorts || [];
    let logit_rasters_folder = task.logit_rasters_folder;
    let output_folder = task.output_folder;
    let popc_format = task.popc_format || "float32";
    let popc_path = task.popc_path;
    let year = task.year;

    //Guard clause
    if (!popc_path || !fs.existsSync(popc_path)) return null;

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
          output_data[j] = pop / cohorts.length;
        } else {
          output_data[j] = pop * (p_val / sum_p);
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

    //Return statement
    return { success: true, year: year };
  };


  /**
   * Scales raster pixel values to match a global total scalar.
   * 
   * @param {Object} arg0_task
   *  @param {string} [arg0_task.format="float32"] - Format of raster.
   *  @param {string} arg0_task.input_path - Source raster path.
   *  @param {string} arg0_task.output_path - Destination raster path.
   *  @param {number} [arg0_task.target] - Target scalar sum.
   *  @param {number} [arg0_task.target_sum] - Target scalar sum alias.
   * 
   * @returns {Promise<Object|null>}
   */
  GeoPNG.tasks.scale_to_global = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
    let format = task.format || "float32";
    let input_path = task.input_path;
    let output_path = task.output_path;
    let target = (task.target !== undefined) ? task.target : task.target_sum;

    //Guard clause
    if (!input_path || !fs.existsSync(input_path)) return null;

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

    //Return statement
    return { output_path: output_path, scalar: scalar, sum: sum, success: true };
  };


  /**
   * Scales raster pixel values by geocode regions to match national targets.
   * 
   * @param {Object} arg0_task
   *  @param {string} [arg0_task.format="float32"] - Format of raster.
   *  @param {Object} arg0_task.geocode_map - Map of colour keys to geocodes.
   *  @param {string} arg0_task.geocodes_raster_path - Path to RGB geocodes raster.
   *  @param {string} arg0_task.input_path - Source raster path.
   *  @param {string} arg0_task.output_path - Destination raster path.
   *  @param {Object} arg0_task.target_gdp_map - National target values per geocode.
   * 
   * @returns {Promise<Object|null>}
   */
  GeoPNG.tasks.scale_to_national = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
    let format = task.format || "float32";
    let geocode_map = task.geocode_map || {};
    let geocodes_raster_path = task.geocodes_raster_path;
    let input_path = task.input_path;
    let output_path = task.output_path;
    let target_gdp_map = task.target_gdp_map || {};

    //Guard clause
    if (!input_path || !fs.existsSync(input_path)) return null;

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
        let colour_key = `${geocode_raster.data[byte_idx]},${geocode_raster.data[byte_idx + 1]},${geocode_raster.data[byte_idx + 2]}`;
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
        let colour_key = `${geocode_raster.data[byte_idx]},${geocode_raster.data[byte_idx + 1]},${geocode_raster.data[byte_idx + 2]}`;
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

    //Return statement
    return { output_path: output_path, success: true };
  };


  /**
   * Generates Stadestér base raster for specified year.
   * 
   * @param {Object} arg0_task
   *  @param {Object} [arg0_task.options={}]
   *  @param {number} arg0_task.year
   * 
   * @returns {Promise<any>}
   */
  GeoPNG.tasks.stadester_base_raster = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Return statement
    return await population_Stadester_rasters.generateStadesterBaseRaster(task.year, task.options || {});
  };


  /**
   * Prepares Stadestér density raster for specified year.
   * 
   * @param {Object} arg0_task
   *  @param {Object} [arg0_task.options={}]
   *  @param {number} arg0_task.year
   * 
   * @returns {Promise<any>}
   */
  GeoPNG.tasks.stadester_density_raster = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Return statement
    return await population_Stadester_rasters.prepareDensityRaster(task.year, task.options || {});
  };


  /**
   * Generates Stadestér total population raster for specified year.
   * 
   * @param {Object} arg0_task
   *  @param {Object} [arg0_task.options={}]
   *  @param {number} arg0_task.year
   * 
   * @returns {Promise<any>}
   */
  GeoPNG.tasks.stadester_population_raster = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Return statement
    return await population_Stadester_rasters.generateStadesterPopulationRaster(task.year, task.options || {});
  };


  /**
   * Generates Stadestér rural population raster for specified year.
   * 
   * @param {Object} arg0_task
   *  @param {Object} [arg0_task.options={}]
   *  @param {number} arg0_task.year
   * 
   * @returns {Promise<any>}
   */
  GeoPNG.tasks.stadester_rural_raster = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Return statement
    return await population_Stadester_rasters.generateStadesterRuralRaster(task.year, task.options || {});
  };


  /**
   * Generates Stadestér urban population raster for specified year.
   * 
   * @param {Object} arg0_task
   *  @param {Object} [arg0_task.options={}]
   *  @param {number} arg0_task.year
   * 
   * @returns {Promise<any>}
   */
  GeoPNG.tasks.stadester_urban_raster = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Return statement
    return await population_Stadester_rasters.generateStadesterUrbanRaster(task.year, task.options || {});
  };
}
