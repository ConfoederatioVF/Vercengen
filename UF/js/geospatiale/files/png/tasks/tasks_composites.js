if (!global.GeoPNG) global.GeoPNG = {};
if (!global.GeoPNG.tasks) global.GeoPNG.tasks = {};

//Initialise composite raster tasks
{
  /**
   * Overlays top raster where top > 0 onto base raster.
   * 
   * @param {Object} arg0_task
   *  @param {string} arg0_task.base_file_path - Path to background raster.
   *  @param {string} [arg0_task.dest_path] - Output destination path alias.
   *  @param {string} [arg0_task.output_file_path] - Output destination path.
   *  @param {string} arg0_task.top_file_path - Path to foreground overlay raster.
   * 
   * @returns {Promise<string>}
   */
  GeoPNG.tasks.composite_overlay = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
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

    //Return statement
    return out_file;
  };


  /**
   * Composite age-sex cohorts with empirical actuals (e.g. HMD pre-1950).
   * 
   * @param {Object} arg0_task
   *  @param {string} arg0_task.clamped_folder - Source folder for clamped cohort rasters.
   *  @param {string[]} arg0_task.cohorts - List of cohort keys.
   *  @param {string} [arg0_task.hmd_folder] - Folder containing HMD empirical rasters.
   *  @param {string} arg0_task.output_folder - Destination folder for composite rasters.
   *  @param {string} [arg0_task.popc_path] - Path to reference population raster.
   *  @param {number} arg0_task.year - Target year.
   * 
   * @returns {Promise<boolean|null>}
   */
  GeoPNG.tasks.composite_cohorts_hmd = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
    let clamped_folder = task.clamped_folder;
    let cohorts = task.cohorts || [];
    let hmd_folder = task.hmd_folder || (global.h2 ? path.join(global.h2, "age_sex_HMD/2.clamped_to_stadester/") : null);
    let output_folder = task.output_folder;
    let popc_path = task.popc_path;
    let year = task.year;

    if (!fs.existsSync(output_folder)) fs.mkdirSync(output_folder, { recursive: true });

    let num_cohorts = cohorts.length;
    let clamped_rasters = {};
    for (let c = 0; c < num_cohorts; c++) {
      let p = path.join(clamped_folder, `global_${cohorts[c]}_${year}.png`);
      if (!fs.existsSync(p)) return null;
      clamped_rasters[cohorts[c]] = await GeoPNG.loadNumberRasterImageAsync(p, { format: "float32" });
    }

    let width = clamped_rasters[cohorts[0]].width;
    let height = clamped_rasters[cohorts[0]].height;
    let total_pixels = width * height;

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

    let popc_raster = (popc_path && fs.existsSync(popc_path)) ?
      await GeoPNG.loadNumberRasterImageAsync(popc_path, { format: "float32" }) : null;

    let out_buffers = new Array(num_cohorts);
    for (let c = 0; c < num_cohorts; c++)
      out_buffers[c] = new Float32Array(total_pixels);

    for (let i = 0; i < total_pixels; i++) {
      if (has_hmd && hmd_total[i] > 0) {
        let stade_pop = popc_raster ? popc_raster.data[i] : hmd_total[i];
        let hmd_scale = (stade_pop > 0 && hmd_total[i] > 0) ? (stade_pop / hmd_total[i]) : 1.0;
        for (let c = 0; c < num_cohorts; c++) {
          let val = (hmd_rasters[cohorts[c]]) ? hmd_rasters[cohorts[c]].data[i] : 0;
          out_buffers[c][i] = val * hmd_scale;
        }
      } else {
        for (let c = 0; c < num_cohorts; c++)
          out_buffers[c][i] = clamped_rasters[cohorts[c]].data[i];
      }
    }

    for (let c = 0; c < num_cohorts; c++) {
      let out_path = path.join(output_folder, `${cohorts[c]}_${year}.png`);
      await GeoPNG.saveNumberRasterImageAsync({
        data: out_buffers[c],
        file_path: out_path,
        format: "float32",
        height: height,
        width: width
      });
    }

    //Return statement
    return true;
  };
}
