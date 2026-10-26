if (!global.GeoPNG) global.GeoPNG = {};
if (!global.GeoPNG.tasks) global.GeoPNG.tasks = {};

//Initialise demographic and migration tasks
{
  /**
   * Clamps professions percentages and aggregates.
   * 
   * @param {Object} arg0_task
   *  @param {string[]} arg0_task.categories
   *  @param {string} arg0_task.input_folder
   *  @param {string} arg0_task.output_folder
   *  @param {number} arg0_task.year
   *  @param {Object} [arg0_task.options]
   * 
   * @returns {Promise<Object>}
   */
  GeoPNG.tasks.clamp_professions = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
    let getCountryStructuralBaselines = function (arg0_gdp_pc, arg1_urb_rate, arg2_year, arg3_sex) {
      let gdp_pc = (typeof arg0_gdp_pc === "number" && !isNaN(arg0_gdp_pc)) ? arg0_gdp_pc : 1000;
      let sex = (arg3_sex || "m").toLowerCase();
      let urb_rate = (typeof arg1_urb_rate === "number" && !isNaN(arg1_urb_rate)) ? arg1_urb_rate : 0.10;
      let year = (typeof arg2_year === "number" && !isNaN(arg2_year)) ? arg2_year : 1860;

      let agri = 0.50;
      let inf = (sex === "f") ? 0.05 : 0.04;
      let mfg = 0.25;
      let serv = 0.20;

      //1. Pre-Neolithic to Neolithic Transition (-10000 to -3000 BC)
      if (year < -3000) {
        let lambda_points = [
          { y: -10000, l: 0.00 }, { y: -8000, l: 0.02 }, { y: -6000, l: 0.10 },
          { y: -4000, l: 0.70 }, { y: -3000, l: 1.00 }
        ];
        let lambda = 0.0;
        if (year <= -10000) {
          lambda = 0.0;
        } else {
          let lower = lambda_points[0], upper = lambda_points[lambda_points.length - 1];
          for (let i = 0; i < lambda_points.length - 1; i++) {
            if (year >= lambda_points[i].y && year <= lambda_points[i + 1].y) {
              lower = lambda_points[i];
              upper = lambda_points[i + 1];
              break;
            }
          }
          let frac = (year - lower.y) / (upper.y - lower.y);
          lambda = lower.l + frac * (upper.l - lower.l);
        }

        let agri_neolithic = 0.85;
        let inf_neolithic = (sex === "f") ? 0.05 : 0.05;
        let mfg_neolithic = 0.06;
        let serv_neolithic = 0.04;

        let forager_agri = 0.05;
        let forager_inf = 0.90;
        let forager_mfg = 0.03;
        let forager_serv = 0.02;

        agri = (1.0 - lambda) * forager_agri + lambda * agri_neolithic;
        inf = (1.0 - lambda) * forager_inf + lambda * inf_neolithic;
        mfg = (1.0 - lambda) * forager_mfg + lambda * mfg_neolithic;
        serv = (1.0 - lambda) * forager_serv + lambda * serv_neolithic;
      } else if (year < 1750) {
        //2. Ancient, Mediaeval, and Early Modern Era (-3000 to 1750 AD)
        let gdp_factor = Math.max(0, Math.min(1, (gdp_pc - 400) / 1600));
        let urb_factor = Math.max(0, Math.min(1, urb_rate / 0.25));

        agri = 0.85 - 0.20 * gdp_factor - 0.25 * urb_factor;
        agri = Math.max(0.40, Math.min(0.92, agri));

        mfg = 0.06 + 0.10 * gdp_factor + 0.12 * urb_factor;
        mfg = Math.max(0.04, Math.min(0.25, mfg));

        serv = 0.04 + 0.08 * gdp_factor + 0.12 * urb_factor;
        serv = Math.max(0.03, Math.min(0.22, serv));

        inf = 1.0 - (agri + mfg + serv);
        inf = Math.max(0.01, Math.min(0.15, inf));
      } else {
        //3. Modern Industrial Era (1750 AD+)
        let log_gdp = Math.log(Math.max(400, gdp_pc));
        let log_gdp_sq = log_gdp * log_gdp;

        agri = 1.80 - 0.18 * log_gdp - 0.40 * urb_rate;
        agri = Math.max(0.01, Math.min(0.85, agri));

        mfg = -0.40 + 0.08 * log_gdp - 0.003 * log_gdp_sq + 0.25 * urb_rate;
        mfg = Math.max(0.05, Math.min(0.45, mfg));

        serv = -0.50 + 0.12 * log_gdp + 0.35 * urb_rate;
        serv = Math.max(0.05, Math.min(0.85, serv));

        inf = 1.0 - (agri + mfg + serv);
        inf = Math.max(0.01, Math.min(0.12, inf));
      }

      let total = agri + inf + mfg + serv;
      if (total <= 0) return { agri: 0.25, inf: 0.25, mfg: 0.25, serv: 0.25 };

      return {
        agriculture: agri / total,
        informal_labour: inf / total,
        manufacturing: mfg / total,
        services: serv / total
      };
    };

    let age_sex_folder = task.age_sex_folder || (global.age_sex ? global.age_sex.output_rasters : null);
    let categories = task.categories || ["agriculture", "manufacturing", "services", "informal_labour", "not_in_work"];
    let gdp_pc_path = task.gdp_pc_path;
    let geocode_path = task.geocode_path || task.geocodes_path;
    let geocode_1913_path = task.geocode_1913_path;
    let geocode_1913_json_path = task.geocode_1913_json_path;
    let input_folder = task.input_folder || task.logit_rasters_folder;
    let lfpr_folder = task.lfpr_folder;
    let logit_rasters_folder = task.logit_rasters_folder || input_folder;
    let olivetti_categories = task.olivetti_categories || ["agriculture", "manufacturing", "services", "informal_labour"];
    let output_aggregates = task.output_aggregates;
    let output_folder = task.output_folder || task.output_percentages;
    let output_percentages = task.output_percentages || output_folder;
    let popc_path = task.popc_path;
    let rur_path = task.rur_path;
    let sexes = task.sexes || [task.sex || "m"];
    let target_folder = task.target_folder;
    let urb_path = task.urb_path || task.urb_rate_path;
    let working_cohorts = task.working_cohorts || ["15", "20", "25", "30", "35", "40", "45", "50", "55", "60"];
    let year = task.year;

    //Guard paths before checking existence
    if (output_folder && typeof output_folder === "string" && !fs.existsSync(output_folder))
      fs.mkdirSync(output_folder, { recursive: true });
    if (output_percentages && typeof output_percentages === "string" && !fs.existsSync(output_percentages))
      fs.mkdirSync(output_percentages, { recursive: true });
    if (output_aggregates && typeof output_aggregates === "string" && !fs.existsSync(output_aggregates))
      fs.mkdirSync(output_aggregates, { recursive: true });

    //Check whether this is the multi-category full professions pipeline
    if (output_percentages && output_aggregates && logit_rasters_folder) {
      let agg_t = {};
      for (let i = 0; i < categories.length; i++) agg_t[categories[i]] = null;
      let height = 2160;
      let pop_t = null;
      let width = 4320;

      for (let s = 0; s < sexes.length; s++) {
        let sex = sexes[s];
        let lfpr_path = (lfpr_folder) ? `${lfpr_folder}lfpr_${sex}_${year}.png` : null;
        if (!lfpr_path || !fs.existsSync(lfpr_path)) continue;
        let lfpr_raster = GeoPNG.loadNumberRasterImage(lfpr_path, { format: "float32" });
        if (!lfpr_raster || !lfpr_raster.data) continue;

        width = lfpr_raster.width;
        height = lfpr_raster.height;
        let data_len = lfpr_raster.data.length;
        let pop_raster = new Float32Array(data_len);

        if (age_sex_folder) {
          for (let i = 0; i < working_cohorts.length; i++) {
            let cp = `${age_sex_folder}${sex}_${working_cohorts[i]}_${year}.png`;
            if (fs.existsSync(cp)) {
              let c_raster = GeoPNG.loadNumberRasterImage(cp, { format: "float32" });
              if (c_raster && c_raster.data) {
                for (let j = 0; j < data_len; j++) {
                  let val = c_raster.data[j];
                  if (!isNaN(val) && val > 0) pop_raster[j] += val;
                }
              }
            }
          }
        }

        if (!pop_t) pop_t = new Float32Array(data_len);
        for (let i = 0; i < data_len; i++) pop_t[i] += pop_raster[i];

        let missing_probs = false;
        let prob_rasters = {};

        for (let i = 0; i < olivetti_categories.length; i++) {
          let path_cand = path.join(logit_rasters_folder, `logit_${sex}_${year}_class_${olivetti_categories[i]}.png`);
          if (!fs.existsSync(path_cand)) { missing_probs = true; break; }
          prob_rasters[olivetti_categories[i]] = GeoPNG.loadNumberRasterImage(path_cand, { format: "float32" });
          if (!prob_rasters[olivetti_categories[i]] || !prob_rasters[olivetti_categories[i]].data) {
            missing_probs = true;
            break;
          }
        }

        if (missing_probs) continue;

        let geocode_data = null;
        if (geocode_path && fs.existsSync(geocode_path)) {
          if (!global._cached_geocodes_raster || global._cached_geocodes_path !== geocode_path) {
            global._cached_geocodes_raster = GeoPNG.loadImage(geocode_path);
            global._cached_geocodes_path = geocode_path;
          }
          if (global._cached_geocodes_raster) geocode_data = global._cached_geocodes_raster.data;
        }

        let geocode_1913_data = null;
        let geocodes_1913_map = null;

        if (year <= 1913 && geocode_1913_path && fs.existsSync(geocode_1913_path)) {
          if (!global._cached_1913_raster || global._cached_1913_path !== geocode_1913_path) {
            global._cached_1913_raster = GeoPNG.loadImage(geocode_1913_path);
            global._cached_1913_path = geocode_1913_path;
          }
          if (global._cached_1913_raster) geocode_1913_data = global._cached_1913_raster.data;

          if (geocode_1913_json_path && fs.existsSync(geocode_1913_json_path)) {
            if (!global._cached_1913_json || global._cached_1913_json_path !== geocode_1913_json_path) {
              try {
                global._cached_1913_json = JSON.parse(fs.readFileSync(geocode_1913_json_path, "utf8"));
                global._cached_1913_json_path = geocode_1913_json_path;
              } catch (e) {}
            }
            geocodes_1913_map = global._cached_1913_json;
          }
        }

        let cid_to_bairoch_key = {};
        if (geocodes_1913_map) {
          for (let k in geocodes_1913_map) {
            let ent = geocodes_1913_map[k];
            if (ent && ent.bairoch_key) cid_to_bairoch_key[ent.cid] = ent.bairoch_key;
          }
        }
        let mcid_to_iso3 = {};
        if (typeof admin_modern !== "undefined" && admin_modern.getISO3ColourcodesObject) {
          let iso3_obj = admin_modern.getISO3ColourcodesObject();
          let b_map = (typeof professions_Bairoch !== "undefined") ? professions_Bairoch.iso3_to_bairoch_map : {};
          for (let col in iso3_obj) {
            let parts = col.split(",");
            let mcid = (parseInt(parts[0]) << 16) | (parseInt(parts[1]) << 8) | parseInt(parts[2]);
            let iso3 = iso3_obj[col][0];
            if (iso3) mcid_to_iso3[mcid] = iso3;
            if (iso3 && b_map && b_map[iso3]) {
              cid_to_bairoch_key[100000 + mcid] = b_map[iso3];
              cid_to_bairoch_key[mcid] = b_map[iso3];
            }
          }
        }

        let has_targets = false;
        let target_rasters = {};
        if (target_folder && fs.existsSync(target_folder)) {
          let all_exist = true;
          for (let i = 0; i < olivetti_categories.length; i++) {
            let tp = `${target_folder}${olivetti_categories[i]}_${sex}_${year}.png`;
            if (!fs.existsSync(tp)) { all_exist = false; break; }
          }
          if (all_exist) {
            has_targets = true;
            for (let i = 0; i < olivetti_categories.length; i++) {
              let tp = `${target_folder}${olivetti_categories[i]}_${sex}_${year}.png`;
              target_rasters[olivetti_categories[i]] = GeoPNG.loadNumberRasterImage(tp, { format: "float32" });
            }
          }
        }

        let gdp_raster = (gdp_pc_path && fs.existsSync(gdp_pc_path)) ? GeoPNG.loadNumberRasterImage(gdp_pc_path, { format: "float32" }) : null;
        let rur_raster = (rur_path && fs.existsSync(rur_path)) ? GeoPNG.loadNumberRasterImage(rur_path, { format: "float32" }) : null;
        let urb_raster = (urb_path && fs.existsSync(urb_path)) ? GeoPNG.loadNumberRasterImage(urb_path, { format: "float32" }) : null;

        let country_stats = {};
        let p0 = prob_rasters[olivetti_categories[0]].data;
        let p1 = prob_rasters[olivetti_categories[1]].data;
        let p2 = prob_rasters[olivetti_categories[2]].data;
        let p3 = prob_rasters[olivetti_categories[3]].data;
        let t0 = (has_targets && target_rasters[olivetti_categories[0]]) ? target_rasters[olivetti_categories[0]].data : null;
        let t1 = (has_targets && target_rasters[olivetti_categories[1]]) ? target_rasters[olivetti_categories[1]].data : null;
        let t2 = (has_targets && target_rasters[olivetti_categories[2]]) ? target_rasters[olivetti_categories[2]].data : null;
        let t3 = (has_targets && target_rasters[olivetti_categories[3]]) ? target_rasters[olivetti_categories[3]].data : null;

        for (let j = 0; j < data_len; j++) {
          let pop = pop_raster[j];
          if (pop <= 0) continue;

          let cid = 0;
          if (year <= 1913 && geocode_1913_data) {
            let b_idx = j * 4;
            let c1913 = (geocode_1913_data[b_idx] << 16) | (geocode_1913_data[b_idx + 1] << 8) | geocode_1913_data[b_idx + 2];
            let mcid = (geocode_data) ? ((geocode_data[b_idx] << 16) | (geocode_data[b_idx + 1] << 8) | geocode_data[b_idx + 2]) : 0;
            if (mcid > 0 && mcid_to_iso3[mcid] === "IRL") {
              cid = 100000 + mcid;
            } else if (c1913 > 0) {
              cid = c1913;
            } else if (mcid > 0) {
              cid = 100000 + mcid;
            }
          } else if (geocode_data) {
            let b_idx = j * 4;
            cid = (geocode_data[b_idx] << 16) | (geocode_data[b_idx + 1] << 8) | geocode_data[b_idx + 2];
          }

          if (!country_stats[cid])
            country_stats[cid] = { gdp_sum: 0, model_sum: [0, 0, 0, 0], pop: 0, rur_sum: 0, target_sum: [0, 0, 0, 0], urb_sum: 0 };

          let cs = country_stats[cid];
          cs.pop += pop;
          if (gdp_raster && !isNaN(gdp_raster.data[j])) cs.gdp_sum += gdp_raster.data[j] * pop;
          if (urb_raster && !isNaN(urb_raster.data[j])) cs.urb_sum += urb_raster.data[j];
          if (rur_raster && !isNaN(rur_raster.data[j])) cs.rur_sum += rur_raster.data[j];

          let p_0 = Math.max(1e-5, p0[j] || 0);
          let p_1 = Math.max(1e-5, p1[j] || 0);
          let p_2 = Math.max(1e-5, p2[j] || 0);
          let p_3 = Math.max(1e-5, p3[j] || 0);

          let sum_p = p_0 + p_1 + p_2 + p_3;
          let norm_p = (sum_p > 0) ? (1 / sum_p) : 0.25;
          cs.model_sum[0] += p_0 * norm_p * pop;
          cs.model_sum[1] += p_1 * norm_p * pop;
          cs.model_sum[2] += p_2 * norm_p * pop;
          cs.model_sum[3] += p_3 * norm_p * pop;

          if (has_targets && t0 && t1 && t2 && t3) {
            let tag = t0[j] || 0, tmf = t1[j] || 0, tse = t2[j] || 0, tinf = t3[j] || 0;
            if (tag + tmf + tse + tinf > 0) {
              cs.target_sum[0] += tag * pop;
              cs.target_sum[1] += tmf * pop;
              cs.target_sum[2] += tse * pop;
              cs.target_sum[3] += tinf * pop;
            }
          }
        }

        let country_factors = {};

        for (let cid in country_stats) {
          let cs = country_stats[cid];
          let f = [1, 1, 1, 1];
          let target = null;
          let tot_target = cs.target_sum[0] + cs.target_sum[1] + cs.target_sum[2] + cs.target_sum[3];

          let avg_gdp = (cs.pop > 0) ? (cs.gdp_sum / cs.pop) : 800;
          let tot_urb_rur = cs.urb_sum + cs.rur_sum;
          let urb_rate = (tot_urb_rur > 0) ? (cs.urb_sum / tot_urb_rur) : 0.08;
          let struct_target = getCountryStructuralBaselines(avg_gdp, urb_rate, year, sex);

          if (tot_target > 0) {
            let emp_inf = cs.target_sum[3] / tot_target;
            if (emp_inf < 0.005) {
              let inf_share = struct_target.informal_labour;
              let tot_formal = cs.target_sum[0] + cs.target_sum[1] + cs.target_sum[2];
              if (tot_formal > 0) {
                let scale = (1.0 - inf_share) / tot_formal;
                target = {
                  agriculture: cs.target_sum[0] * scale,
                  manufacturing: cs.target_sum[1] * scale,
                  services: cs.target_sum[2] * scale,
                  informal_labour: inf_share
                };
              } else {
                target = struct_target;
              }
            } else {
              target = {
                agriculture: cs.target_sum[0] / tot_target,
                manufacturing: cs.target_sum[1] / tot_target,
                services: cs.target_sum[2] / tot_target,
                informal_labour: emp_inf
              };
            }
          } else {
            let b_key = cid_to_bairoch_key[cid] || null;
            if (b_key && typeof professions_Bairoch !== "undefined" && professions_Bairoch.applyBairochTarget) {
              target = professions_Bairoch.applyBairochTarget(b_key, struct_target, year, sex);
            } else {
              target = struct_target;
            }
          }

          if (target && cs.pop > 0) {
            let m0 = cs.model_sum[0] / cs.pop;
            let m1 = cs.model_sum[1] / cs.pop;
            let m2 = cs.model_sum[2] / cs.pop;
            let m3 = cs.model_sum[3] / cs.pop;

            f[0] = (m0 > 1e-6) ? (target.agriculture / m0) : ((target.agriculture > 0) ? 1.0 : 0.0);
            f[1] = (m1 > 1e-6) ? (target.manufacturing / m1) : ((target.manufacturing > 0) ? 1.0 : 0.0);
            f[2] = (m2 > 1e-6) ? (target.services / m2) : ((target.services > 0) ? 1.0 : 0.0);
            f[3] = (m3 > 1e-6) ? (target.informal_labour / m3) : ((target.informal_labour > 0) ? 1.0 : 0.0);
          }
          country_factors[cid] = f;
        }

        let agg_arrays = {};
        let pct_arrays = {};
        for (let i = 0; i < categories.length; i++) {
          let c = categories[i];
          agg_arrays[c] = new Float32Array(data_len);
          pct_arrays[c] = new Float32Array(data_len);
          if (!agg_t[c]) agg_t[c] = new Float32Array(data_len);
        }

        let pct_c0 = pct_arrays[olivetti_categories[0]];
        let pct_c1 = pct_arrays[olivetti_categories[1]];
        let pct_c2 = pct_arrays[olivetti_categories[2]];
        let pct_c3 = pct_arrays[olivetti_categories[3]];
        let pct_niw = pct_arrays["not_in_work"];

        let agg_c0 = agg_arrays[olivetti_categories[0]];
        let agg_c1 = agg_arrays[olivetti_categories[1]];
        let agg_c2 = agg_arrays[olivetti_categories[2]];
        let agg_c3 = agg_arrays[olivetti_categories[3]];
        let agg_niw = agg_arrays["not_in_work"];

        let agg_t0 = agg_t[olivetti_categories[0]];
        let agg_t1 = agg_t[olivetti_categories[1]];
        let agg_t2 = agg_t[olivetti_categories[2]];
        let agg_t3 = agg_t[olivetti_categories[3]];

        for (let j = 0; j < data_len; j++) {
          let pop = pop_raster[j];
          if (pop <= 0) continue;

          let lfpr = lfpr_raster.data[j];
          if (isNaN(lfpr)) lfpr = 0;

          let cid = 0;
          if (year <= 1913 && geocode_1913_data) {
            let b_idx = j * 4;
            let c1913 = (geocode_1913_data[b_idx] << 16) | (geocode_1913_data[b_idx + 1] << 8) | geocode_1913_data[b_idx + 2];
            let mcid = (geocode_data) ? ((geocode_data[b_idx] << 16) | (geocode_data[b_idx + 1] << 8) | geocode_data[b_idx + 2]) : 0;
            if (mcid > 0 && mcid_to_iso3[mcid] === "IRL") {
              cid = 100000 + mcid;
            } else if (c1913 > 0) {
              cid = c1913;
            } else if (mcid > 0) {
              cid = 100000 + mcid;
            }
          } else if (geocode_data) {
            let b_idx = j * 4;
            cid = (geocode_data[b_idx] << 16) | (geocode_data[b_idx + 1] << 8) | geocode_data[b_idx + 2];
          }
          let f = country_factors[cid] || [1, 1, 1, 1];

          let p_0 = Math.max(1e-5, p0[j] || 0);
          let p_1 = Math.max(1e-5, p1[j] || 0);
          let p_2 = Math.max(1e-5, p2[j] || 0);
          let p_3 = Math.max(1e-5, p3[j] || 0);

          let u0 = p_0 * f[0];
          let u1 = p_1 * f[1];
          let u2 = p_2 * f[2];
          let u3 = p_3 * f[3];
          let sum_u = u0 + u1 + u2 + u3;

          let norm_u = (sum_u > 0) ? (lfpr / sum_u) : 0;
          let b_u = (sum_u > 0) ? 0 : (lfpr * 0.25);
          let final_0 = u0 * norm_u + b_u;
          let final_1 = u1 * norm_u + b_u;
          let final_2 = u2 * norm_u + b_u;
          let final_3 = u3 * norm_u + b_u;
          let final_niw = Math.max(0, 1.0 - lfpr);

          pct_c0[j] = final_0;
          pct_c1[j] = final_1;
          pct_c2[j] = final_2;
          pct_c3[j] = final_3;
          if (pct_niw) pct_niw[j] = final_niw;

          let a0 = final_0 * pop;
          let a1 = final_1 * pop;
          let a2 = final_2 * pop;
          let a3 = final_3 * pop;
          let aniw = final_niw * pop;

          agg_c0[j] = a0;
          agg_c1[j] = a1;
          agg_c2[j] = a2;
          agg_c3[j] = a3;
          if (agg_niw) agg_niw[j] = aniw;

          agg_t0[j] += a0;
          agg_t1[j] += a1;
          agg_t2[j] += a2;
          agg_t3[j] += a3;
        }

        for (let i = 0; i < categories.length; i++) {
          let c = categories[i];
          GeoPNG.saveNumberRasterImage({ file_path: `${output_percentages}${c}_${sex}_${year}.png`, format: "float32", height: height, width: width, function: (idx) => pct_arrays[c][idx] });
          GeoPNG.saveNumberRasterImage({ file_path: `${output_aggregates}${c}_${sex}_${year}.png`, format: "float32", height: height, width: width, function: (idx) => agg_arrays[c][idx] });
        }
      }

      if (pop_t) {
        for (let i = 0; i < categories.length; i++) {
          let c = categories[i];
          GeoPNG.saveNumberRasterImage({ file_path: `${output_percentages}${c}_t_${year}.png`, format: "float32", height: height, width: width, function: (idx) => (pop_t[idx] > 0) ? (agg_t[c][idx] / pop_t[idx]) : 0 });
          GeoPNG.saveNumberRasterImage({ file_path: `${output_aggregates}${c}_t_${year}.png`, format: "float32", height: height, width: width, function: (idx) => agg_t[c][idx] });
        }
      }

      return { success: true, year: year };
    }

    //Fallback / simplified 4-category logic if input_folder and output_folder are provided
    if (!input_folder || !output_folder) return { success: false, reason: "missing_paths" };

    let sex = sexes[0] || "m";
    let cat_rasters = {};
    for (let c = 0; c < categories.length; c++) {
      let cat = categories[c];
      let p = path.join(input_folder, `${sex}_${cat}_${year}.png`);
      if (fs.existsSync(p)) {
        cat_rasters[cat] = await GeoPNG.loadNumberRasterImageAsync(p, { format: "float32" });
      }
    }

    let popc_raster = (popc_path && fs.existsSync(popc_path)) ?
      await GeoPNG.loadNumberRasterImageAsync(popc_path, { format: "float32" }) : null;
    let gdp_raster = (gdp_pc_path && fs.existsSync(gdp_pc_path)) ?
      await GeoPNG.loadNumberRasterImageAsync(gdp_pc_path, { format: "float32" }) : null;
    let urb_raster = (urb_path && fs.existsSync(urb_path)) ?
      await GeoPNG.loadNumberRasterImageAsync(urb_path, { format: "float32" }) : null;

    let first_cat = categories[0];
    if (!cat_rasters[first_cat] || !cat_rasters[first_cat].data) return { success: false, reason: "missing_input_rasters" };

    let height = cat_rasters[first_cat].height;
    let total_pixels = cat_rasters[first_cat].data.length;
    let width = cat_rasters[first_cat].width;

    let out_buffers = {};
    for (let c = 0; c < categories.length; c++)
      out_buffers[categories[c]] = new Float32Array(total_pixels);

    for (let i = 0; i < total_pixels; i++) {
      let pop = (popc_raster) ? popc_raster.data[i] : 1;
      if (pop <= 0 || isNaN(pop)) continue;

      let gdp_pc = (gdp_raster) ? gdp_raster.data[i] : 1000;
      let urb_rate = (urb_raster) ? urb_raster.data[i] : 0.10;
      let baselines = getCountryStructuralBaselines(gdp_pc, urb_rate, year, sex);

      let sum = 0;
      for (let c = 0; c < categories.length; c++) {
        let cat = categories[c];
        let val = (cat_rasters[cat] && cat_rasters[cat].data) ? cat_rasters[cat].data[i] : 0;
        if (isNaN(val) || val <= 0) val = baselines[cat] || 0.25;
        out_buffers[cat][i] = val;
        sum += val;
      }

      if (sum > 0) {
        let inv_sum = 1 / sum;
        for (let c = 0; c < categories.length; c++)
          out_buffers[categories[c]][i] *= inv_sum;
      } else {
        for (let c = 0; c < categories.length; c++)
          out_buffers[categories[c]][i] = baselines[categories[c]] || 0.25;
      }
    }

    for (let c = 0; c < categories.length; c++) {
      let cat = categories[c];
      let out_path = path.join(output_folder, `${sex}_${cat}_${year}.png`);
      await GeoPNG.saveNumberRasterImageAsync({
        data: out_buffers[cat],
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
   * Derives migration rasters (births, deaths, cohort sex ratio, net migration).
   * 
   * @param {Object} arg0_task
   * 
   * @returns {Promise<Object>}
   */
  GeoPNG.tasks.derive_migration_rasters = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
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
    let year_gap = task.year_gap || 10;

    if (!overwrite && net_migration_path && fs.existsSync(net_migration_path) &&
        (!female_migration_path || fs.existsSync(female_migration_path)) &&
        (!male_migration_path || fs.existsSync(male_migration_path)))
      return { skipped: true, year: task.year };

    if (!popc_path || typeof popc_path !== "string" || !fs.existsSync(popc_path))
      return { reason: "missing_popc", success: false };

    let popc_raster = await GeoPNG.loadNumberRasterImageAsync(popc_path, { format: "float32" });
    if (!popc_raster || !popc_raster.data) return { reason: "corrupt_popc", success: false };
    let total_pixels = popc_raster.data.length;
    let height = popc_raster.height;
    let width = popc_raster.width;

    let delta_raster = (delta_popc_path && typeof delta_popc_path === "string" && fs.existsSync(delta_popc_path)) ?
      await GeoPNG.loadNumberRasterImageAsync(delta_popc_path, { format: "float32" }) : null;
    let prev_popc = (previous_popc_path && typeof previous_popc_path === "string" && fs.existsSync(previous_popc_path)) ?
      await GeoPNG.loadNumberRasterImageAsync(previous_popc_path, { format: "float32" }) : null;

    let births_raster = (births_path && typeof births_path === "string" && fs.existsSync(births_path)) ?
      await GeoPNG.loadNumberRasterImageAsync(births_path, { format: "float32" }) : null;
    let f_deaths = (female_deaths_path && typeof female_deaths_path === "string" && fs.existsSync(female_deaths_path)) ?
      await GeoPNG.loadNumberRasterImageAsync(female_deaths_path, { format: "float32" }) : null;
    let m_deaths = (male_deaths_path && typeof male_deaths_path === "string" && fs.existsSync(male_deaths_path)) ?
      await GeoPNG.loadNumberRasterImageAsync(male_deaths_path, { format: "float32" }) : null;

    let net_migration = new Float32Array(total_pixels);
    let f_migration = new Float32Array(total_pixels);
    let m_migration = new Float32Array(total_pixels);

    for (let i = 0; i < total_pixels; i++) {
      let delta = delta_raster ? delta_raster.data[i] : (prev_popc ? (popc_raster.data[i] - prev_popc.data[i]) : 0);
      let births = births_raster ? births_raster.data[i] : 0;
      let deaths = (f_deaths ? f_deaths.data[i] : 0) + (m_deaths ? m_deaths.data[i] : 0);

      let natural_increase = (births - deaths) * (year_gap / 10);
      let mig = delta - natural_increase;

      net_migration[i] = mig;
      f_migration[i] = mig * 0.49;
      m_migration[i] = mig * 0.51;
    }

    if (net_migration_path && typeof net_migration_path === "string") {
      let out_dir = path.dirname(net_migration_path);
      if (!fs.existsSync(out_dir)) fs.mkdirSync(out_dir, { recursive: true });

      await GeoPNG.saveNumberRasterImageAsync({
        data: net_migration,
        file_path: net_migration_path,
        format: "float32",
        height: height,
        width: width
      });
    }

    if (female_migration_path && typeof female_migration_path === "string") {
      let f_dir = path.dirname(female_migration_path);
      if (!fs.existsSync(f_dir)) fs.mkdirSync(f_dir, { recursive: true });
      await GeoPNG.saveNumberRasterImageAsync({
        data: f_migration,
        file_path: female_migration_path,
        format: "float32",
        height: height,
        width: width
      });
    }

    if (male_migration_path && typeof male_migration_path === "string") {
      let m_dir = path.dirname(male_migration_path);
      if (!fs.existsSync(m_dir)) fs.mkdirSync(m_dir, { recursive: true });
      await GeoPNG.saveNumberRasterImageAsync({
        data: m_migration,
        file_path: male_migration_path,
        format: "float32",
        height: height,
        width: width
      });
    }

    //Return statement
    return { success: true, year: task.year };
  };
}
