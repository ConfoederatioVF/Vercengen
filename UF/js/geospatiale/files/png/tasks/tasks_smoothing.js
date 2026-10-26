if (!global.GeoPNG) global.GeoPNG = {};
if (!global.GeoPNG.tasks) global.GeoPNG.tasks = {};

//Initialise demographic smoothing and graduation tasks
{
  /**
   * Internal routine for demographic cohort graduation with Isotonic (PAVA), Whittaker-Henderson, or Piecewise-Kernel.
   * 
   * @param {Object} arg0_task
   * @param {string} [arg1_type]
   * 
   * @returns {Promise<Object|null>}
   * @private
   */
  let clampCohortsGraduation = async function (arg0_task, arg1_type) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};
    let task_type = (arg1_type) ? arg1_type : (task.type || task.task_type);

    //Declare local instance variables
    let cdt_end_year = (task.cdt_end_year !== undefined) ? task.cdt_end_year : 1850;
    let cdt_start_year = (task.cdt_start_year !== undefined) ? task.cdt_start_year : 1750;
    let cdt_steepness = (task.cdt_steepness !== undefined) ? task.cdt_steepness : 8;
    let cohorts = task.cohorts || [];
    let logit_folder = task.logit_rasters_folder;
    let output_folder = task.output_folder;
    let popc_path = task.popc_path;
    let year = task.year;

    //Compute piecewise-kernel weight w in [0, 1] (0 = pure PAVA, 1 = pure Whittaker)
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

    if (!popc_path || !fs.existsSync(popc_path)) return null;
    let popc_raster = await GeoPNG.loadNumberRasterImageAsync(popc_path, { format: task.popc_format || "float32" });
    let height = popc_raster.height;
    let total_pixels = popc_raster.data.length;
    let width = popc_raster.width;

    let missing_probs = false;
    let prob_rasters = {};
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

    if (wh_weight <= 0.0) {
      //--- PURE PER-PIXEL ISOTONIC (PAVA) CLAMPING PATH ---
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
      let smoothing_start = (task.smoothing_start_index !== undefined) ? task.smoothing_start_index : 2;
      let tot_coupled_buf = new Float32Array(age_count);

      for (let i = 0; i < total_pixels; i++) {
        let stade_pop = popc_raster.data[i];
        if (stade_pop < 0.01 || isNaN(stade_pop)) continue;

        for (let k = 0; k < age_count; k++) {
          let f_val = prob_rasters[cohorts[f_indices[k]]].data[i];
          let m_val = prob_rasters[cohorts[m_indices[k]]].data[i];

          raw_f[k] = (f_val > 0 && isFinite(f_val)) ? f_val : 0;
          raw_m[k] = (m_val > 0 && isFinite(m_val)) ? m_val : 0;
        }

        //Local monotonic ceiling for elderly cohorts (indices 14 to 17: 65, 70, 75, 80)
        for (let k = 14; k < age_count; k++) {
          let max_f_w = (raw_f[k - 1] / age_band_widths[k - 1]) * age_band_widths[k] * 1.05;
          let max_m_w = (raw_m[k - 1] / age_band_widths[k - 1]) * age_band_widths[k] * 1.05;

          if (raw_f[k] > max_f_w && max_f_w > 0) raw_f[k] = max_f_w;
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
      //--- ISO3 COUNTRY PYRAMID GRADUATION (WHITTAKER-HENDERSON / TRANSITION) ---
      let geocodes_csv_path = task.geocodes_csv_path || path.join(global.h1 || "./histmap/1.data_raw/", "admin_modern/geocodes.csv");
      let geocodes_raster_path = task.geocodes_raster_path || path.join(global.h1 || "./histmap/1.data_raw/", "admin_modern/geocodes.png");

      if (!GeoPNG._cached_geocodes_index && fs.existsSync(geocodes_raster_path) && fs.existsSync(geocodes_csv_path)) {
        let all_iso = [];
        let color_to_iso_id = new Map();
        let csv_content = fs.readFileSync(geocodes_csv_path, "utf8");
        let lines = csv_content.split(/\r?\n/).filter(l => l.trim().length > 0);

        for (let i = 1; i < lines.length; i++) {
          let parts = lines[i].split(";");
          let color = parts[4] ? parts[4].trim() : null;
          let iso3 = parts[0].trim();

          if (color) {
            let cparts = color.split(",").map(Number);
            let id = all_iso.indexOf(iso3);
            let key = (cparts[0] << 16) | (cparts[1] << 8) | cparts[2];

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
          let key = (geocodes_raster.data[b] << 16) | (geocodes_raster.data[b + 1] << 8) | geocodes_raster.data[b + 2];
          let id = color_to_iso_id.get(key);
          if (id !== undefined) pixel_iso_ids[i] = id;
        }

        GeoPNG._cached_geocodes_index = {
          all_iso: all_iso,
          pixel_iso_ids: pixel_iso_ids
        };
      }

      let all_iso = (GeoPNG._cached_geocodes_index) ? GeoPNG._cached_geocodes_index.all_iso : [];
      let num_bins = all_iso.length + 1;
      let fallback_bin_id = num_bins - 1;
      let pixel_iso_ids = (GeoPNG._cached_geocodes_index) ? GeoPNG._cached_geocodes_index.pixel_iso_ids : null;

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

      for (let i = 0; i < total_pixels; i++) {
        let stade_pop = popc_raster.data[i];
        if (stade_pop < 0.01 || isNaN(stade_pop)) continue;

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

      let enforce_bounds = (task.enforce_biological_sex_ratios === true);
      let enforce_fixed = (task.enforce_fixed_sex_ratios === true);
      let preserve_sex_ratios = (task.preserve_sex_ratios !== undefined) ? task.preserve_sex_ratios : !enforce_fixed && !enforce_bounds;
      let smoothing_start_idx = (task.lift_isotonic || task.do_not_smooth) ? null : ((task.smoothing_start_index !== undefined) ? task.smoothing_start_index : 2);

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
      }

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

    for (let c = 0; c < num_cohorts; c++) {
      let out_path = path.join(output_folder, `global_${cohorts[c]}_${year}.png`);
      await GeoPNG.saveNumberRasterImageAsync({
        data: output_buffers[c],
        file_path: out_path,
        format: "float32",
        height: height,
        width: width
      });
    }

    //Return statement
    return { success: true, year: year };
  };

  /**
   * Clamps cohorts using isotonic (PAVA) graduation.
   */
  GeoPNG.tasks.clamp_cohorts_isotonic = async function (arg0_task) {
    return await clampCohortsGraduation(arg0_task, "clamp_cohorts_isotonic");
  };

  /**
   * Clamps cohorts using piecewise logistic graduation.
   */
  GeoPNG.tasks.clamp_cohorts_piecewise = async function (arg0_task) {
    return await clampCohortsGraduation(arg0_task, "clamp_cohorts_piecewise");
  };

  /**
   * Clamps cohorts using Whittaker-Henderson graduation.
   */
  GeoPNG.tasks.clamp_cohorts_whittaker = async function (arg0_task) {
    return await clampCohortsGraduation(arg0_task, "clamp_cohorts_whittaker");
  };
}
