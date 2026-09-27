//Initialise functions
{
	if (!global.Statistics)
		/**
		 * The namespace for all UF/Statistics utility functions, typically for static methods.
		 *
		 * @namespace Statistics
		 */
		global.Statistics = {};
	
	/**
	 * LearningFramework provides unified pipelines for running regression models on images and spatial rasters
	 * across distinct learning modes (e.g. 'ols', 'multinomial_logit').
	 *
	 * @class LearningFramework
	 */
	Statistics.LearningFramework = class {
		/**
		 * Evaluates a model against a dataset of samples.
		 * @alias Statistics.LearningFramework.evaluate
		 *
		 * @param {Object|string} arg0_model - Model object or file path.
		 * @param {Object} arg1_dataset - { keys, X, Y }
		 * @param {Object} [arg2_options]
		 *  @param {string} [arg2_options.mode="ols"] - 'ols' | 'multinomial_logit'
		 *
		 * @returns {Object} Evaluation metrics.
		 */
		static evaluate (arg0_model, arg1_dataset, arg2_options) {
			//Convert from parameters
			let model_obj = File.loadJSON(arg0_model);
			let dataset = arg1_dataset;
			let options = (arg2_options) ? arg2_options : {};
			
			//Initialise options
			if (!options.mode)
				options.mode = (model_obj.type === "multinomial_logit") ? "multinomial_logit" : "ols";
			
			//Declare local instance variables
			let keys = dataset.keys;
			let X = dataset.X;
			let Y = dataset.Y;
			
			if (options.mode === "multinomial_logit")
				return Statistics.evaluateMultinomialModel(model_obj, dataset);
			
			//OLS evaluation: R^2, RMSE, MAE
			let n = X.length;
			if (n === 0) return { mae: 0, r2: 0, rmse: 0, sample_count: 0 };
			
			let coefficients = model_obj.coefficients || {};
			let sum_err_sq = 0;
			let sum_abs_err = 0;
			let sum_y = 0;
			let sum_y_sq = 0;
			
			for (let i = 0; i < n; i++) {
				let row_x = X[i];
				let actual_y = Array.isArray(Y[i]) ? Y[i][0] : Y[i];
				let predicted_y = 0;
				
				for (let j = 0; j < keys.length; j++) {
					let coeff = coefficients[keys[j]] || 0;
					predicted_y += row_x[j]*coeff;
				}
				
				let err = actual_y - predicted_y;
				sum_err_sq += err*err;
				sum_abs_err += Math.abs(err);
				sum_y += actual_y;
				sum_y_sq += actual_y*actual_y;
			}
			
			let mean_y = sum_y/n;
			let ss_tot = sum_y_sq - n*mean_y*mean_y;
			let r2 = (ss_tot > 0) ? (1 - (sum_err_sq/ss_tot)) : 0;
			
			//Return statement
			return {
				mae: sum_abs_err/n,
				r2: Math.max(-1, Math.min(1, r2)),
				rmse: Math.sqrt(sum_err_sq/n),
				sample_count: n
			};
		}
		
		/**
		 * Ingests and formats covariate rasters and target rasters into training matrices X and Y
		 * based on the selected learning mode.
		 * @alias Statistics.LearningFramework.extractImageDataset
		 *
		 * @param {string} arg0_target_file_path - File path to target raster (continuous utility or class labels).
		 * @param {Object} [arg1_options]
		 *  @param {Object} arg1_options.covariates_obj - Map of covariate keys to paths or functions.
		 *  @param {Array} [arg1_options.formatting_parameters] - Spread into function-valued covariates.
		 *  @param {string} [arg1_options.mode="ols"] - 'ols' | 'multinomial_logit'
		 *  @param {number} [arg1_options.nodata_value] - Dropped nodata value for categorical classification.
		 *  @param {string} [arg1_options.target_format="int32"]
		 *
		 * @returns {Promise<Object>} - { keys, X, Y, sample_count }
		 */
		static async extractImageDataset (arg0_target_file_path, arg1_options) {
			//Convert from parameters
			let target_file_path = path.resolve(arg0_target_file_path);
			let options = (arg1_options) ? arg1_options : {};
			
			//Initialise options
			if (!options.formatting_parameters) options.formatting_parameters = [];
			if (!options.mode) options.mode = "ols";
			if (!options.target_format)
				options.target_format = (options.mode === "multinomial_logit") ?
					(options.class_format || "int32") : (options.utility_format || "int32");
			
			//Declare local instance variables
			let is_categorical = (options.mode === "multinomial_logit");
			let target_image = GeoPNG.loadNumberRasterImage(target_file_path, {
				format: options.target_format
			});
			let target_data = target_image.data;
			
			//Load all covariate rasters as raw data buffers
			let { rasters_obj, valid_keys } = Statistics.loadCovariateRasters(options.covariates_obj, {
				data_only: true,
				formatting_parameters: options.formatting_parameters
			});
			
			let feature_count = valid_keys.length;
			let input_data = valid_keys.map((key) => rasters_obj[key]);
			let sample_count = target_data.length;
			let X = [];
			let Y = [];
			
			//Load weight raster if provided (for Weighted Least Squares)
			let weight_data = null;
			if (options.weight_file_path && fs.existsSync(options.weight_file_path)) {
				let weight_image = GeoPNG.loadNumberRasterImage(options.weight_file_path, {
					format: "float32"
				});
				weight_data = weight_image.data;
			}
			
			//Iterate over all pixels
			for (let i = 0; i < sample_count; i++) {
				let has_data = false;
				let is_valid = true;
				let target_value = target_data[i];
				
				if (isNaN(target_value)) {
					is_valid = false;
				} else if (is_categorical) {
					if (options.nodata_value !== undefined && target_value === options.nodata_value)
						is_valid = false;
				} else {
					//Continuous OLS mode
					if (target_value !== 0) has_data = true;
				}
				
				let local_row = new Array(feature_count);
				
				if (is_valid) {
					for (let x = 0; x < feature_count; x++) {
						let local_val = input_data[x][i];
						if (isNaN(local_val)) {
							is_valid = false;
							break;
						}
						local_row[x] = local_val;
						if (local_val !== 0) has_data = true;
					}
				}
				
				if (is_valid) {
					if (weight_data) {
						let weight = weight_data[i];
						if (isNaN(weight) || weight <= 0) {
							is_valid = false;
						} else {
							let sqrt_w = Math.sqrt(weight);
							target_value *= sqrt_w;
							for (let x = 0; x < feature_count; x++) {
								local_row[x] *= sqrt_w;
							}
						}
					}
				}
				
				if (is_valid) {
					if (is_categorical) {
						X.push(local_row);
						Y.push([target_value]);
					} else if (has_data) {
						X.push(local_row);
						Y.push([target_value]);
					}
				}
			}
			
			//Return statement
			return {
				feature_count: feature_count,
				keys: valid_keys,
				sample_count: X.length,
				X: X,
				Y: Y
			};
		}
		
		/**
		 * Samples points over covariate rasters for training.
		 * @alias Statistics.LearningFramework.extractPointDataset
		 *
		 * @param {Array<Object>} arg0_points - Array of { coords: [lng, lat], target: number, year: number }
		 * @param {number} arg1_year - Target year to sample.
		 * @param {Object} [arg2_options]
		 *  @param {Object} arg2_options.covariates_obj
		 *  @param {number} [arg2_options.covariates_year]
		 *  @param {Function} [arg2_options.get_pixel_function]
		 *
		 * @returns {Promise<Object>} - { keys, X, Y }
		 */
		static async extractPointDataset (arg0_points, arg1_year, arg2_options) {
			//Convert from parameters
			let points_list = arg0_points;
			let target_year = parseInt(arg1_year);
			let options = (arg2_options) ? arg2_options : {};
			
			//Declare local instance variables
			let covariates_year = (options.covariates_year !== undefined) ?
				parseInt(options.covariates_year) : target_year;
			let { rasters_obj: loaded_rasters, valid_keys } = Statistics.loadCovariateRasters(
				options.covariates_obj, { year: covariates_year }
			);
			let x_matrix = [];
			let y_matrix = [];
			
			//Guard clause if no valid keys were loaded
			if (valid_keys.length === 0) return { keys: [], X: [], Y: [] };
			
			let year_points = points_list.filter((p) =>
				parseInt(p.year) === target_year &&
				p.target !== undefined && p.target !== null && !isNaN(p.target)
			);
			
			for (let i = 0; i < year_points.length; i++) {
				let current_point = year_points[i];
				let coords = current_point.coords;
				let lng_val = parseFloat(coords[0]);
				let lat_val = parseFloat(coords[1]);
				let is_valid = true;
				let point_features = [];
				
				for (let j = 0; j < valid_keys.length; j++) {
					let key = valid_keys[j];
					let raster = loaded_rasters[key];
					
					let pixel_coords = (options.get_pixel_function) ?
						options.get_pixel_function(lng_val, lat_val, raster.width, raster.height) :
						((typeof Geospatiale !== "undefined" && Geospatiale.getEquirectangularCoordsPixel) ?
							Geospatiale.getEquirectangularCoordsPixel(lng_val, lat_val, { width: raster.width, height: raster.height }) :
							[
								Math.min(raster.width - 1, Math.max(0, Math.floor(((lng_val + 180)/360)*raster.width))),
								Math.min(raster.height - 1, Math.max(0, Math.floor(((90 - lat_val)/180)*raster.height)))
							]);
					
					if (!pixel_coords) {
						is_valid = false;
						break;
					}
					
					let cx = pixel_coords[0];
					let cy = pixel_coords[1];
					let pixel_index = cy*raster.width + cx;
					let feature_value = raster.data[pixel_index];
					
					if (isNaN(feature_value)) {
						is_valid = false;
						break;
					}
					
					point_features.push(feature_value);
				}
				
				if (is_valid && point_features.length === valid_keys.length) {
					x_matrix.push(point_features);
					y_matrix.push([current_point.target]);
				}
			}
			
			//Return statement
			return { keys: valid_keys, X: x_matrix, Y: y_matrix };
		}
		
		/**
		 * Evaluates a regression model over an image canvas to generate output raster predictions.
		 * Supports linear combination surfaces for OLS, and argmax class maps or probability surfaces for Multinomial Logit.
		 * @alias Statistics.LearningFramework.predictRaster
		 *
		 * @param {string} arg0_output_file_path
		 * @param {Object|string} arg1_model - JSON model object or file path.
		 * @param {Object} [arg2_options]
		 *  @param {number|string} [arg2_options.class] - Target class for probability mode.
		 *  @param {Object} arg2_options.covariates_obj
		 *  @param {string} [arg2_options.format] - Output raster format ('int32', 'float32').
		 *  @param {Array} [arg2_options.formatting_parameters]
		 *  @param {function} [arg2_options.guard_clause]
		 *  @param {number} [arg2_options.height=2160]
		 *  @param {string} [arg2_options.mode] - 'ols' | 'multinomial_logit' (inferred if omitted).
		 *  @param {string} [arg2_options.output_mode="class"] - 'class' | 'probability' | 'probabilities' (multinomial).
		 *  @param {number} [arg2_options.width=4320]
		 *
		 * @returns {Promise<void>}
		 */
		static async predictRaster (arg0_output_file_path, arg1_model, arg2_options) {
			//Convert from parameters
			let output_file_path = arg0_output_file_path;
			let model_obj = File.loadJSON(arg1_model);
			let options = (arg2_options) ? arg2_options : {};
			
			//Initialise options
			let mode = options.mode || ((model_obj.type === "multinomial_logit" || model_obj.type === "multinomial_ensemble") ? "multinomial_logit" : ((model_obj.type === "anchored_multinomial_gam") ? "anchored_multinomial_gam" : "ols"));
			options.height = Math.returnSafeNumber(options.height, 2160);
			options.width = Math.returnSafeNumber(options.width, 4320);
			if (!options.formatting_parameters) options.formatting_parameters = [];
			
			//Declare local instance variables
			let { rasters_obj, valid_keys } = Statistics.loadCovariateRasters(options.covariates_obj, {
				formatting_parameters: options.formatting_parameters
			});
			
			let land_raster_data = null;
			if (options.landarea_raster_path && fs.existsSync(options.landarea_raster_path))
				land_raster_data = GeoPNG.loadNumberRasterImage(options.landarea_raster_path, { format: "int32" })?.data;

			let passes_guard = (local_index) => {
				if (options.guard_clause)
					return options.guard_clause(local_index, rasters_obj);
				if (options.guard_type === "uninhabited" || options.mask_uninhabited) {
					let local_pop = Math.returnSafeNumber(rasters_obj["popd_"]?.data[local_index], 0);
					if (local_pop === 0) return false;
					if (land_raster_data && land_raster_data[local_index] === 0) return false;
				}
				return true;
			};
			
			let chunk_pixels = 100*options.width;
			let total_pixels = options.width*options.height;
			
			//Branch based on mode
			if (mode === "multinomial_logit") {
				let all_classes = model_obj.classes.map(c => String(c));
				let feature_data = valid_keys.map(k => rasters_obj[k]?.data);
				let num_all_classes = all_classes.length;
				let num_features = valid_keys.length;
				let output_mode = options.output_mode || "class";

				//Support both discrete multinomial_logit models and probability-space multinomial_ensemble mixtures
				let is_ensemble = (model_obj.type === "multinomial_ensemble" && Array.isArray(model_obj.models) && model_obj.models.length > 0);
				let sub_models_data = [];

				if (is_ensemble) {
					let total_weight = 0;
					for (let m = 0; m < model_obj.models.length; m++) {
						let entry = model_obj.models[m];
						let sub_obj = (typeof entry.model === "string") ? File.loadJSON(entry.model) : entry.model;
						let w = Math.returnSafeNumber(entry.weight, 1);
						if (sub_obj) {
							sub_models_data.push({ model: sub_obj, weight: w });
							total_weight += w;
						}
					}
					if (total_weight > 0) {
						for (let m = 0; m < sub_models_data.length; m++)
							sub_models_data[m].weight /= total_weight;
					}
				} else {
					sub_models_data.push({ model: model_obj, weight: 1.0 });
				}

				let num_models = sub_models_data.length;
				let sub_intercepts = new Array(num_models);
				let sub_weights = new Array(num_models);
				let sub_weight_vals = new Float64Array(num_models);

				for (let m = 0; m < num_models; m++) {
					let sub = sub_models_data[m].model;
					let s_intercepts = new Float64Array(num_all_classes);
					let s_weights = new Array(num_all_classes);

					for (let c = 0; c < num_all_classes; c++) {
						let coeff_block = sub.coefficients ? sub.coefficients[all_classes[c]] : null;
						let weights = new Float64Array(num_features);
						if (coeff_block) {
							s_intercepts[c] = Math.returnSafeNumber(coeff_block._intercept, 0);
							for (let k = 0; k < num_features; k++) {
								weights[k] = Math.returnSafeNumber(coeff_block[valid_keys[k]], 0);
							}
						}
						s_weights[c] = weights;
					}
					sub_intercepts[m] = s_intercepts;
					sub_weights[m] = s_weights;
					sub_weight_vals[m] = sub_models_data[m].weight;
				}

				if (output_mode === "class") {
					let format = options.format || "int32";
					let local_exps = new Float64Array(num_all_classes);
					let local_logits = new Float64Array(num_all_classes);
					let output_buffer = new Float32Array(total_pixels);
					let pixel_probs = new Float64Array(num_all_classes);

					for (let start_idx = 0; start_idx < total_pixels; start_idx += chunk_pixels) {
						let end_idx = Math.min(start_idx + chunk_pixels, total_pixels);
						for (let local_index = start_idx; local_index < end_idx; local_index++) {
							if (!passes_guard(local_index)) {
								output_buffer[local_index] = 0;
								continue;
							}

							for (let c = 0; c < num_all_classes; c++) pixel_probs[c] = 0;

							for (let m = 0; m < num_models; m++) {
								let max_l = -Infinity;
								let s_intercepts = sub_intercepts[m];
								let s_weights = sub_weights[m];
								let w_m = sub_weight_vals[m];

								for (let c = 0; c < num_all_classes; c++) {
									let sum = s_intercepts[c];
									let w = s_weights[c];
									for (let k = 0; k < num_features; k++) {
										let fd = feature_data[k];
										if (fd) sum += fd[local_index]*w[k];
									}
									local_logits[c] = sum;
									if (sum > max_l) max_l = sum;
								}

								let sum_exp = 0;
								for (let c = 0; c < num_all_classes; c++) {
									let e = Math.exp(local_logits[c] - max_l);
									local_exps[c] = e;
									sum_exp += e;
								}
								let inv_sum = (sum_exp > 0) ? (1/sum_exp) : 0;

								for (let c = 0; c < num_all_classes; c++)
									pixel_probs[c] += w_m*(local_exps[c]*inv_sum);
							}

							let argmax_c = 0;
							let max_p = -1;
							for (let c = 0; c < num_all_classes; c++) {
								if (pixel_probs[c] > max_p) {
									max_p = pixel_probs[c];
									argmax_c = c;
								}
							}
							output_buffer[local_index] = argmax_c;
						}
						
						if (typeof Blacktraffic !== "undefined" && Blacktraffic.yield)
							await Blacktraffic.yield(0);
					}
					
					await GeoPNG.saveNumberRasterImageAsync({
						data: output_buffer,
						file_path: output_file_path,
						format: format,
						height: options.height,
						width: options.width
					});
					
					console.log(`Saved multinomial class raster for ${output_file_path}.`);
				} else if (output_mode === "probability" || output_mode === "probabilities") {
					let is_single = (output_mode === "probability");
					let local_exps = new Float64Array(num_all_classes);
					let local_logits = new Float64Array(num_all_classes);
					let target_classes = is_single ?
						[String(options.class)] : all_classes;
					let target_indices = target_classes.map(tc => all_classes.indexOf(tc));
					let num_targets = target_classes.length;

					let output_buffers = new Array(num_targets);
					for (let tc = 0; tc < num_targets; tc++)
						output_buffers[tc] = new Float32Array(total_pixels);

					//Single contiguous pass over all pixels
					for (let start_idx = 0; start_idx < total_pixels; start_idx += chunk_pixels) {
						let end_idx = Math.min(start_idx + chunk_pixels, total_pixels);
						for (let local_index = start_idx; local_index < end_idx; local_index++) {
							if (!passes_guard(local_index)) continue; //Buffers are zero-initialized

							for (let m = 0; m < num_models; m++) {
								let max_l = -Infinity;
								let s_intercepts = sub_intercepts[m];
								let s_weights = sub_weights[m];
								let w_m = sub_weight_vals[m];

								for (let c = 0; c < num_all_classes; c++) {
									let sum = s_intercepts[c];
									let w = s_weights[c];
									for (let k = 0; k < num_features; k++) {
										let fd = feature_data[k];
										if (fd) sum += fd[local_index]*w[k];
									}
									local_logits[c] = sum;
									if (sum > max_l) max_l = sum;
								}

								let sum_exp = 0;
								for (let c = 0; c < num_all_classes; c++) {
									let e = Math.exp(local_logits[c] - max_l);
									local_exps[c] = e;
									sum_exp += e;
								}
								let inv_sum = (sum_exp > 0) ? (1/sum_exp) : 0;

								for (let tc = 0; tc < num_targets; tc++) {
									let c_idx = target_indices[tc];
									if (c_idx >= 0)
										output_buffers[tc][local_index] += w_m*(local_exps[c_idx]*inv_sum);
								}
							}
						}
						
						if (typeof Blacktraffic !== "undefined" && Blacktraffic.yield)
							await Blacktraffic.yield(0);
					}

					for (let tc = 0; tc < num_targets; tc++) {
						let local_class = target_classes[tc];
						let local_path = is_single ?
							output_file_path : output_file_path.replace(/(\.[^.]+)$/, `_class_${local_class}$1`);

						await GeoPNG.saveNumberRasterImageAsync({
							data: output_buffers[tc],
							file_path: local_path,
							format: "float32",
							height: options.height,
							width: options.width
						});
					}
					console.log(`Saved ${num_targets} probability rasters for ${output_file_path}.`);
				}
			} else if (mode === "anchored_multinomial_gam") {
				let all_classes = model_obj.classes.map(c => String(c));
				let num_all_classes = all_classes.length;
				let output_mode = options.output_mode || "probabilities";

				//1. Baseline premodern logit model
				let premodern_model = (typeof model_obj.premodern_model_path === "string") ?
					File.loadJSON(model_obj.premodern_model_path) : (model_obj.premodern_model || {});
				let pre_covariates = premodern_model.covariates || [];
				let num_pre_covariates = pre_covariates.length;
				let pre_feature_data = pre_covariates.map(k => rasters_obj[k]?.data);

				let pre_intercepts = new Float64Array(num_all_classes);
				let pre_weights = new Array(num_all_classes);
				for (let c = 0; c < num_all_classes; c++) {
					let class_key = all_classes[c];
					let coeff_block = premodern_model.coefficients ? premodern_model.coefficients[class_key] : null;
					let weights = new Float64Array(num_pre_covariates);
					if (coeff_block) {
						pre_intercepts[c] = Math.returnSafeNumber(coeff_block._intercept, 0);
						for (let k = 0; k < num_pre_covariates; k++) {
							weights[k] = Math.returnSafeNumber(coeff_block[pre_covariates[k]], 0);
						}
					}
					pre_weights[c] = weights;
				}

				//2. Basis matrix and GAM mode weights
				let basis_matrix = model_obj.basis_matrix || {};
				let component_names = model_obj.component_names || [];
				let gam_weights = model_obj.gam_weights || {};
				let num_components = component_names.length;

				//3. Target year determination
				let target_year = options.year;
				if (target_year === undefined) {
					let year_match = output_file_path.match(/[_-](\d+)(?:[._]|$)/);
					if (year_match) target_year = parseInt(year_match[1]);
				}
				target_year = Math.returnSafeNumber(target_year, 2020);

				//4. Cached feature references
				let delta_popc_data = rasters_obj["delta_popc_"]?.data;
				let delta_urbc_data = rasters_obj["delta_urbc_"]?.data;
				let gdp_ppp_data = rasters_obj["gdp_ppp_pc"]?.data;
				let net_wealth_data = rasters_obj["net_wealth"]?.data;
				let popc_data = rasters_obj["popc_"]?.data;
				let popd_data = rasters_obj["popd_"]?.data;
				let urbc_data = rasters_obj["urbc_"]?.data;

				let f_00_idx = all_classes.indexOf("f_00");
				let m_00_idx = all_classes.indexOf("m_00");

				let is_single = (output_mode === "probability");
				let target_classes = is_single ? [String(options.class)] : all_classes;
				let target_indices = target_classes.map(tc => all_classes.indexOf(tc));
				let num_targets = target_classes.length;

				let output_buffers = new Array(num_targets);
				for (let tc = 0; tc < num_targets; tc++)
					output_buffers[tc] = new Float32Array(total_pixels);

				let local_exps = new Float64Array(num_all_classes);
				let local_logits = new Float64Array(num_all_classes);
				let z_scores = new Float64Array(num_components);

				//Contiguous evaluation over all pixels
				for (let start_idx = 0; start_idx < total_pixels; start_idx += chunk_pixels) {
					let end_idx = Math.min(start_idx + chunk_pixels, total_pixels);
					for (let local_index = start_idx; local_index < end_idx; local_index++) {
						if (!passes_guard(local_index)) continue;

						//A. Premodern baseline logits
						for (let c = 0; c < num_all_classes; c++) {
							let sum = pre_intercepts[c];
							let w = pre_weights[c];
							for (let k = 0; k < num_pre_covariates; k++) {
								let fd = pre_feature_data[k];
								if (fd) sum += fd[local_index]*w[k];
							}
							local_logits[c] = sum;
						}

						//B. Contemporary demographic GAM correction (only if activated for y >= 1500)
						if (target_year >= 1500) {
							let popd_val = (popd_data) ? popd_data[local_index] : 0;
							let popc_val = (popc_data) ? popc_data[local_index] : 0;
							let urbc_val = (urbc_data) ? urbc_data[local_index] : 0;
							let gdp_ppp_val = (gdp_ppp_data) ? gdp_ppp_data[local_index] : 0;

							let log_gdp = Math.log(Math.max(500, gdp_ppp_val));
							let log_density = Math.log(Math.max(0.1, popd_val));
							let urban_share = (popc_val > 0) ? Math.min(1.0, urbc_val/popc_val) : 0;

							let dev_score = 0.60*((log_gdp - 6.9)/3.2) + 0.30*urban_share + 0.10*Math.min(1.0, Math.max(0, (log_density - 2.0)/5.0));
							let activation = 1/(1 + Math.exp(-8*(dev_score - 0.22)));
							activation = Math.max(0, Math.min(1.0, activation));

							if (activation > 0) {
								let delta_popc = (delta_popc_data) ? delta_popc_data[local_index] : 0;
								let delta_urbc = (delta_urbc_data) ? delta_urbc_data[local_index] : 0;
								let net_wealth = (net_wealth_data) ? net_wealth_data[local_index] : 0;

								let density_norm = (log_density - 3.0)/2.0;
								let gdp_norm = (log_gdp - 8.0)/1.5;
								let gdp_sq = gdp_norm*gdp_norm;
								let momentum_pop = delta_popc/Math.max(10, popc_val);
								let momentum_urb = delta_urbc/Math.max(10, popc_val);
								let wealth_per_cap = (net_wealth > 0) ? (net_wealth/Math.max(1, popc_val)) : (3.0*gdp_ppp_val);
								let wealth_pc = (Math.log(Math.max(100, wealth_per_cap)) - 8.0)/1.5;

								let phi_gdp_sq = gdp_sq;
								let phi_log_density = density_norm;
								let phi_log_gdp_ppp_pc = gdp_norm;
								let phi_momentum_pop = momentum_pop;
								let phi_momentum_urb = momentum_urb;
								let phi_urban_share = urban_share - 0.3;
								let phi_wealth_pc = wealth_pc;

								for (let k = 0; k < num_components; k++) {
									let comp_name = component_names[k];
									let w_obj = gam_weights[comp_name];
									if (!w_obj) {
										z_scores[k] = 0;
										continue;
									}
									z_scores[k] = Math.returnSafeNumber(w_obj["intercept"], 0) +
										Math.returnSafeNumber(w_obj["gdp_sq"], 0)*phi_gdp_sq +
										Math.returnSafeNumber(w_obj["log_density"], 0)*phi_log_density +
										Math.returnSafeNumber(w_obj["log_gdp_ppp_pc"], 0)*phi_log_gdp_ppp_pc +
										Math.returnSafeNumber(w_obj["momentum_pop"], 0)*phi_momentum_pop +
										Math.returnSafeNumber(w_obj["momentum_urb"], 0)*phi_momentum_urb +
										Math.returnSafeNumber(w_obj["urban_share"], 0)*phi_urban_share +
										Math.returnSafeNumber(w_obj["wealth_pc"], 0)*phi_wealth_pc;
								}

								for (let c = 0; c < num_all_classes; c++) {
									let class_key = all_classes[c];
									let basis_vec = basis_matrix[class_key];
									if (!basis_vec) continue;

									let delta_c = 0;
									for (let k = 0; k < num_components; k++)
										delta_c += basis_vec[k]*z_scores[k];

									local_logits[c] += activation*delta_c;
								}

								//Infant biological sex ratio alignment
								if (f_00_idx >= 0 && m_00_idx >= 0) {
									let logit_f00 = local_logits[f_00_idx];
									let logit_m00 = local_logits[m_00_idx];
									let natural_diff = 0.04879; // Math.log(1.05)
									local_logits[m_00_idx] = (1 - activation)*logit_m00 + activation*(logit_f00 + natural_diff);
								}
							}
						}

						//C. Softmax across cohorts
						let max_l = -Infinity;
						for (let c = 0; c < num_all_classes; c++) {
							if (local_logits[c] > max_l) max_l = local_logits[c];
						}

						let sum_exp = 0;
						for (let c = 0; c < num_all_classes; c++) {
							let e = Math.exp(local_logits[c] - max_l);
							local_exps[c] = e;
							sum_exp += e;
						}
						let inv_sum = (sum_exp > 0) ? (1/sum_exp) : 0;

						for (let tc = 0; tc < num_targets; tc++) {
							let c_idx = target_indices[tc];
							if (c_idx >= 0)
								output_buffers[tc][local_index] = local_exps[c_idx]*inv_sum;
						}
					}

					if (typeof Blacktraffic !== "undefined" && Blacktraffic.yield)
						await Blacktraffic.yield(0);
				}

				for (let tc = 0; tc < num_targets; tc++) {
					let local_class = target_classes[tc];
					let local_path = is_single ?
						output_file_path : output_file_path.replace(/(\.[^.]+)$/, `_class_${local_class}$1`);

					await GeoPNG.saveNumberRasterImageAsync({
						data: output_buffers[tc],
						file_path: local_path,
						format: "float32",
						height: options.height,
						width: options.width
					});
				}
				console.log(`Saved ${num_targets} GAM probability rasters for ${output_file_path}.`);
			} else {
				//Mode 'ols': linear dot product of covariates and coefficients
				let coefficients_obj = model_obj.coefficients || {};
				let format = options.format || "float32";
				let output_buffer = new Float32Array(total_pixels);
				let valid_features = valid_keys.map((k) => ({
					coeff: Math.returnSafeNumber(coefficients_obj[k]),
					data: rasters_obj[k]?.data
				}));
				let num_features = valid_features.length;
				
				for (let start_idx = 0; start_idx < total_pixels; start_idx += chunk_pixels) {
					let end_idx = Math.min(start_idx + chunk_pixels, total_pixels);
					for (let local_index = start_idx; local_index < end_idx; local_index++) {
						if (!passes_guard(local_index)) {
							output_buffer[local_index] = 0;
							continue;
						}
						
						let local_sum = 0;
						for (let k = 0; k < num_features; k++) {
							let f = valid_features[k];
							if (f.data) local_sum += f.data[local_index]*f.coeff;
						}
						
						output_buffer[local_index] = local_sum;
					}
					
					if (typeof Blacktraffic !== "undefined" && Blacktraffic.yield)
						await Blacktraffic.yield(0);
				}
				
				await GeoPNG.saveNumberRasterImageAsync({
					data: output_buffer,
					file_path: output_file_path,
					format: format,
					height: options.height,
					width: options.width
				});
				
				console.log(`Saved OLS raster for ${output_file_path}.`);
			}
		}
		
		/**
		 * Coordinates training a regression model on an image dataset according to the selected mode.
		 * @alias Statistics.LearningFramework.train
		 *
		 * @param {string} arg0_output_file_path
		 * @param {Object} arg1_dataset - { keys, X, Y }
		 * @param {Object} [arg2_options]
		 *  @param {string} [arg2_options.mode="ols"] - 'ols' | 'multinomial_logit'
		 *
		 * @returns {Promise<Object|null>}
		 */
		static async train (arg0_output_file_path, arg1_dataset, arg2_options) {
			//Convert from parameters
			let output_file_path = arg0_output_file_path;
			let dataset = arg1_dataset;
			let options = (arg2_options) ? arg2_options : {};
			
			//Initialise options
			if (!options.mode) options.mode = "ols";
			
			//Branch based on mode
			if (options.mode === "multinomial_logit") {
				return await Statistics.trainMultinomialLogitModel(output_file_path, dataset, options);
			} else {
				return await Statistics.trainOLSModel(output_file_path, dataset, options);
			}
		}
	};
}
