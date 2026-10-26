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
	 * Computes predicted compositional class probabilities for a single feature object using a trained ALR model.
	 *
	 * @alias Statistics.predictALRProbabilities
	 *
	 * @param {Object} arg0_features_obj - Feature mapping.
	 * @param {Object} arg1_model_obj - Trained ALR model object with .categories, .reference_category, and .coefficients.
	 *
	 * @returns {Object} Mapping of category names to probabilities summing to 1.0.
	 */
	Statistics.predictALRProbabilities = function (arg0_features_obj, arg1_model_obj) {
		//Convert from parameters
		let features_obj = arg0_features_obj;
		let model_obj = arg1_model_obj;
		
		//Declare local instance variables
		let categories = model_obj.categories;
		let coefficients = model_obj.coefficients || {};
		let num_categories = categories.length;
		let reference_category = model_obj.reference_category || categories[0];
		
		let exps = new Float64Array(num_categories);
		let logits = new Float64Array(num_categories);
		let max_l = 0;
		let return_obj = {};
		let sum_exp = 0;
		
		for (let c = 0; c < num_categories; c++) {
			let cat = categories[c];
			if (cat === reference_category) {
				logits[c] = 0;
			} else {
				let block = coefficients[cat];
				let sum = 0;
				if (block) {
					sum += Math.returnSafeNumber(block._intercept, 0);
					Object.iterate(block, (local_k, local_val) => {
						if (local_k !== "_intercept")
							sum += Math.returnSafeNumber(features_obj[local_k], 0)*local_val;
					});
				}
				logits[c] = sum;
			}
			if (logits[c] > max_l) max_l = logits[c];
		}
		
		for (let c = 0; c < num_categories; c++) {
			let e = Math.exp(logits[c] - max_l);
			exps[c] = e;
			sum_exp += e;
		}
		
		let inv_sum = (sum_exp > 0) ? (1/sum_exp) : 0;
		for (let c = 0; c < num_categories; c++)
			return_obj[categories[c]] = exps[c]*inv_sum;
		
		//Return statement
		return return_obj;
	};
	
	/**
	 * Trains an Additive Log-Ratio (ALR) regularised ridge regression model for continuous compositional targets.
	 * Bypasses gradient descent under-convergence by solving normal equations analytically.
	 *
	 * @alias Statistics.trainALRModel
	 *
	 * @param {string} arg0_output_file_path - File path to save the trained model.
	 * @param {Object} arg1_covariates_obj - { keys, X, Y, categories, [reference_category] }
	 * @param {Object} [arg2_options]
	 *  @param {string} [arg2_options.key]
	 *  @param {number} [arg2_options.lambda=1e-3] - Ridge penalty strength.
	 *  @param {number} [arg2_options.smoothing=1e-6] - Log-ratio epsilon smoothing.
	 *
	 * @returns {Promise<Object|null>}
	 */
	Statistics.trainALRModel = async function (arg0_output_file_path, arg1_covariates_obj, arg2_options) {
		//Convert from parameters
		let output_file_path = path.resolve(arg0_output_file_path);
		let covariates_obj = arg1_covariates_obj;
		let options = (arg2_options) ? arg2_options : {};
		
		//Initialise options
		let fit_intercept = (options.fit_intercept !== false);
		let lambda = Math.returnSafeNumber(options.lambda, 1e-3);
		let smoothing = Math.returnSafeNumber(options.smoothing, 1e-6);
		if (!options.key) options.key = output_file_path;
		
		//Declare local instance variables
		let basename = path.basename(output_file_path);
		let categories = covariates_obj.categories || [];
		let keys = covariates_obj.keys || [];
		let reference_category = covariates_obj.reference_category || categories[0];
		let X = Array.unwrapMatrix(covariates_obj.X);
		let Y = Array.unwrapMatrix(covariates_obj.Y);
		
		let N = X.length;
		if (N === 0) return null;
		let K = keys.length;
		let C = categories.length;
		if (C < 2) return null;
		
		let ref_idx = categories.indexOf(reference_category);
		if (ref_idx === -1) ref_idx = 0;
		reference_category = categories[ref_idx];
		
		console.log(`- Training ALR Compositional Ridge Model for ${basename} (${N} samples, ${C} categories) ..`);
		
		//Compute scales for covariates, optionally prepending an unscaled constant column (intercept)
		//Total feature count = fit_intercept ? K + 1 : K
		let total_K = fit_intercept ? K + 1 : K;
		let scales = new Array(total_K).fill(1);
		
		for (let j = 0; j < K; j++) {
			let sum_sq = 0;
			for (let i = 0; i < N; i++)
				sum_sq += X[i][j]*X[i][j];
			let rms = Math.sqrt(sum_sq/N);
			let s_idx = fit_intercept ? j + 1 : j;
			scales[s_idx] = (rms > 1e-12) ? rms : 1;
		}
		
		//Build scaled design matrix X_ext
		let X_ext = Array.createMatrix(N, total_K);
		for (let i = 0; i < N; i++) {
			if (fit_intercept) X_ext[i][0] = 1.0;
			for (let j = 0; j < K; j++) {
				let s_idx = fit_intercept ? j + 1 : j;
				X_ext[i][s_idx] = X[i][j]/scales[s_idx];
			}
		}
		
		//Accumulate X^T X
		let XT_X = Array.createMatrix(total_K, total_K);
		for (let i = 0; i < N; i++) {
			let row = X_ext[i];
			for (let j = 0; j < total_K; j++) {
				let val_j = row[j];
				for (let k = j; k < total_K; k++)
					XT_X[j][k] += val_j*row[k];
			}
		}
		
		for (let j = 0; j < total_K; j++)
			for (let k = 0; k < j; k++)
				XT_X[j][k] = XT_X[k][j];
		
		//Add ridge penalty (do not penalise intercept col 0 if fit_intercept is true)
		let start_ridge = fit_intercept ? 1 : 0;
		for (let j = start_ridge; j < total_K; j++)
			XT_X[j][j] += lambda;
		
		//Invert regularised Gram matrix
		let XT_X_inv;
		try {
			let ml = (typeof ml_matrix !== "undefined") ? ml_matrix : ((typeof require !== "undefined") ? require("ml-matrix") : null);
			if (ml && ml.inverse) {
				XT_X_inv = ml.inverse(new ml.Matrix(XT_X)).to2DArray();
			} else if (typeof mathjs !== "undefined") {
				XT_X_inv = Array.unwrapMatrix(mathjs.inv(XT_X));
			}
		} catch (e) {
			console.warn(`- Singular Gram matrix in ALR training for ${basename}. Falling back to pseudo-inverse.`);
			try {
				let ml = (typeof ml_matrix !== "undefined") ? ml_matrix : ((typeof require !== "undefined") ? require("ml-matrix") : null);
				if (ml && ml.pseudoInverse) {
					XT_X_inv = ml.pseudoInverse(new ml.Matrix(XT_X)).to2DArray();
				} else {
					XT_X_inv = Array.unwrapMatrix(mathjs.pinv(XT_X));
				}
			} catch (e2) {
				XT_X_inv = Array.unwrapMatrix(mathjs.pinv(XT_X));
			}
		}
		
		//Fit coefficients for each non-reference category
		let coefficients_obj = {};
		
		for (let c = 0; c < C; c++) {
			if (c === ref_idx) continue;
			let cat = categories[c];
			
			//Construct log-ratio target vector z_c = log((y_c + eps)/(y_ref + eps))
			let XT_Z = new Float64Array(total_K);
			for (let i = 0; i < N; i++) {
				let y_c = Math.max(Y[i][c], 0);
				let y_ref = Math.max(Y[i][ref_idx], 0);
				let z_val = Math.log((y_c + smoothing)/(y_ref + smoothing));
				let row = X_ext[i];
				
				for (let j = 0; j < total_K; j++)
					XT_Z[j] += row[j]*z_val;
			}
			
			//Solve beta_scaled = (X^T X)^-1 X^T z
			let beta_scaled = new Float64Array(total_K);
			for (let j = 0; j < total_K; j++)
				for (let k = 0; k < total_K; k++)
					beta_scaled[j] += XT_X_inv[j][k]*XT_Z[k];
			
			//Rescale beta back to original covariate scale: beta[0] unscaled, beta[j] = beta_scaled[j]/scale[j]
			if (fit_intercept) {
				let intercept_val = beta_scaled[0];
				if (options.clamp_percentage && (intercept_val > 1 || intercept_val < -1)) intercept_val = 0;
				coefficients_obj[cat] = { _intercept: intercept_val };
			} else {
				coefficients_obj[cat] = {};
			}
			
			for (let j = 0; j < K; j++) {
				let s_idx = fit_intercept ? j + 1 : j;
				let val = beta_scaled[s_idx] / scales[s_idx];
				if (options.clamp_percentage && (val > 1 || val < -1)) val = 0;
				coefficients_obj[cat][keys[j]] = val;
			}
		}
		
		let model_data_obj = {
			key: options.key,
			type: "alr_compositional",
			categories: categories,
			reference_category: reference_category,
			covariates: keys,
			has_intercept: true,
			coefficients: coefficients_obj,
			training: {
				lambda: lambda,
				sample_count: N,
				smoothing: smoothing
			}
		};
		
		fs.writeFileSync(output_file_path, JSON.stringify(model_data_obj, null, 2));
		console.log(`ALR Compositional model for ${options.key} saved successfully in ${output_file_path}.`);
		
		//Return statement
		return model_data_obj;
	};
	
	/**
	 * Computes a robust composite ALR compositional model across a series of annual anchor models.
	 * Averages category coefficients in log-odds parameter space across valid historical anchor models.
	 *
	 * @alias Statistics.geomeanALRModels
	 *
	 * @param {string} arg0_input_folder_path - Directory containing annual ALR JSON models.
	 * @param {string} arg1_model_prefix - File prefix to filter, e.g. "multinomial_model_m_".
	 * @param {Object} [arg2_options]
	 *  @param {string} [arg2_options.output_file_path] - Output path for the composite model.
	 *  @param {number} [arg2_options.min_year] - Optional minimum year filter (inclusive).
	 *  @param {number} [arg2_options.max_year] - Optional maximum year filter (inclusive).
	 *  @param {Array<string>} [arg2_options.categories] - Category labels override.
	 *  @param {string} [arg2_options.reference_category] - Reference category override.
	 *  @param {boolean} [arg2_options.weighted=true] - Whether to weight by anchor sample count.
	 *
	 * @returns {Promise<Object|null>} The generated composite ALR model object.
	 */
	Statistics.geomeanALRModels = async function (arg0_input_folder_path, arg1_model_prefix, arg2_options) {
		//Convert from parameters
		let input_folder_path = arg0_input_folder_path;
		let model_prefix = arg1_model_prefix;
		let options = (arg2_options) ? arg2_options : {};

		//Initialise options
		let max_year = (options.max_year !== undefined) ? options.max_year : Infinity;
		let min_year = (options.min_year !== undefined) ? options.min_year : -Infinity;
		let weighted = (options.weighted !== undefined) ? options.weighted : true;

		//Declare local instance variables
		let all_files = fs.readdirSync(input_folder_path);
		let all_models = [];
		let categories = options.categories;
		let composite_coefficients = {};
		let covariates = options.covariates;
		let format_slug = model_prefix.replace(/[_\s]+$/, "");
		let model_data_obj;
		let out_path = options.output_file_path || path.join(input_folder_path, `geomean_${format_slug}.json`);
		let reference_category = options.reference_category;
		let total_samples = 0;
		let total_weight = 0;

		//Guard clauses
		if (!fs.existsSync(input_folder_path)) return null;

		//Function body
		for (let i = 0; i < all_files.length; i++) {
			let file_name = all_files[i];
			if (file_name.startsWith(model_prefix) && file_name.endsWith(".json")) {
				if (file_name.includes("unified") || file_name.includes("geomean") || file_name.includes("weights") || file_name.includes("preindustrial") || file_name.includes("industrial") || file_name.includes("modern"))
					continue;

				let year_match = file_name.match(/_(-?\d+)\.json$/);
				let year = year_match ? parseInt(year_match[1]) : null;
				if (year !== null && (year < min_year || year > max_year))
					continue;

				let full_path = path.join(input_folder_path, file_name);
				try {
					let m = JSON.parse(fs.readFileSync(full_path, "utf8"));
					if (m && m.coefficients) {
						let samples = Math.returnSafeNumber(m.training?.sample_count, 1000);
						all_models.push({
							coefficients: m.coefficients,
							has_intercept: (m.has_intercept !== false),
							model_path: full_path,
							sample_count: samples,
							year: year
						});
						total_samples += samples;
						if (!categories && m.categories) categories = m.categories;
						if (!reference_category && m.reference_category) reference_category = m.reference_category;
						if (!covariates && m.covariates) covariates = m.covariates;
					}
				} catch (err) {
					console.warn(`[geomeanALRModels] Could not parse ${file_name}:`, err.message);
				}
			}
		}

		if (all_models.length === 0) {
			console.warn(`[geomeanALRModels] No models matched prefix '${model_prefix}' in [${min_year}, ${max_year}].`);
			return null;
		}

		for (let i = 0; i < all_models.length; i++) {
			let w = (weighted && total_samples > 0) ? all_models[i].sample_count : 1.0;
			all_models[i].weight = w;
			total_weight += w;
		}
		for (let i = 0; i < all_models.length; i++)
			all_models[i].weight /= total_weight;

		for (let c = 0; c < categories.length; c++) {
			let cat = categories[c];
			if (cat === reference_category) continue;
			composite_coefficients[cat] = {};

			let intercept_sum = 0;
			for (let i = 0; i < all_models.length; i++) {
				let b = all_models[i].coefficients[cat];
				intercept_sum += all_models[i].weight * Math.returnSafeNumber(b?._intercept, 0);
			}
			composite_coefficients[cat]._intercept = intercept_sum;

			for (let j = 0; j < covariates.length; j++) {
				let cov_key = covariates[j];
				let cov_sum = 0;
				for (let i = 0; i < all_models.length; i++) {
					let b = all_models[i].coefficients[cat];
					cov_sum += all_models[i].weight * Math.returnSafeNumber(b?.[cov_key], 0);
				}
				composite_coefficients[cat][cov_key] = cov_sum;
			}
		}

		model_data_obj = {
			key: out_path,
			type: "alr_compositional",
			categories: categories,
			reference_category: reference_category,
			covariates: covariates,
			has_intercept: true,
			coefficients: composite_coefficients,
			training: {
				anchors_count: all_models.length,
				sample_count_total: total_samples,
				years: all_models.map(m => m.year).filter(y => y !== null)
			}
		};

		fs.writeFileSync(out_path, JSON.stringify(model_data_obj, null, 2));
		console.log(`ALR composite model generated and saved to ${out_path} using ${all_models.length} anchors.`);

		//Return statement
		return model_data_obj;
	};

	/**
	 * Generates multi-class probability rasters from a trained ALR compositional model.
	 * Supports discrete ALR models, probability-blended multinomial_ensemble mixtures, and uninhabited masking.
	 *
	 * @alias Statistics.generateALRRaster
	 *
	 * @param {string} arg0_output_file_path - Output file path prefix or base name.
	 * @param {Object} [arg1_options]
	 *  @param {Object} arg1_options.covariates_obj
	 *  @param {Object|string} arg1_options.model_obj
	 *  @param {number} [arg1_options.height=2160]
	 *  @param {number} [arg1_options.width=4320]
	 *  @param {boolean} [arg1_options.mask_uninhabited=false]
	 *  @param {Function} [arg1_options.guard_clause]
	 *
	 * @returns {Promise<void>}
	 */
	Statistics.generateALRRaster = async function (arg0_output_file_path, arg1_options) {
		//Convert from parameters
		let output_file_path = arg0_output_file_path;
		let options = (arg1_options) ? arg1_options : {};
		let model_obj = (typeof options.model_obj === "string") ?
			File.loadJSON(path.resolve(options.model_obj)) : options.model_obj;

		//Initialise options
		let height = Math.returnSafeNumber(options.height, 2160);
		let width = Math.returnSafeNumber(options.width, 4320);

		//Declare local instance variables
		let categories;
		let chunk_pixels = 100*width;
		let feature_data;
		let is_ensemble = (model_obj && model_obj.type === "multinomial_ensemble" && Array.isArray(model_obj.models) && model_obj.models.length > 0);
		let land_raster_data = null;
		let local_exps;
		let local_logits;
		let num_categories;
		let num_features;
		let num_models;
		let output_buffers;
		let passes_guard;
		let reference_category;
		let sub_intercepts;
		let sub_model_weights;
		let sub_models_data = [];
		let sub_weights;
		let total_pixels = width*height;
		let total_weight = 0;

		//Unpack ensemble or discrete model
		if (is_ensemble) {
			for (let m = 0; m < model_obj.models.length; m++) {
				let entry = model_obj.models[m];
				let sub_obj = (typeof entry.model === "string") ?
					File.loadJSON(path.resolve(entry.model)) : entry.model;
				let w = Math.returnSafeNumber(entry.weight, 1);
				if (sub_obj && sub_obj.coefficients) {
					sub_models_data.push({ model: sub_obj, weight: w });
					total_weight += w;
				}
			}
			if (total_weight > 0) {
				for (let m = 0; m < sub_models_data.length; m++)
					sub_models_data[m].weight /= total_weight;
			}
		} else if (model_obj && model_obj.coefficients) {
			sub_models_data.push({ model: model_obj, weight: 1.0 });
		}

		if (sub_models_data.length === 0 && model_obj && model_obj.fallback_model) {
			let fallback_obj = (typeof model_obj.fallback_model === "string") ?
				File.loadJSON(path.resolve(model_obj.fallback_model)) : model_obj.fallback_model;
			if (fallback_obj && fallback_obj.coefficients)
				sub_models_data.push({ model: fallback_obj, weight: 1.0 });
		}

		if (sub_models_data.length === 0) {
			console.warn(`[generateALRRaster] No valid sub-models or coefficients found for prediction at ${output_file_path}.`);
			return;
		}

		categories = model_obj.categories || sub_models_data[0].model.categories;
		num_categories = categories.length;
		reference_category = model_obj.reference_category || sub_models_data[0].model.reference_category || categories[0];

		let { rasters_obj, valid_keys } = Statistics.loadCovariateRasters(options.covariates_obj);
		num_features = valid_keys.length;
		feature_data = valid_keys.map(k => rasters_obj[k]?.data);

		num_models = sub_models_data.length;
		sub_intercepts = new Array(num_models);
		sub_model_weights = new Float64Array(num_models);
		sub_weights = new Array(num_models);

		for (let m = 0; m < num_models; m++) {
			let sub = sub_models_data[m].model;
			let sub_coeff = sub.coefficients || {};
			let s_intercepts = new Float64Array(num_categories);
			let s_weights = new Array(num_categories);

			for (let c = 0; c < num_categories; c++) {
				let cat = categories[c];
				if (cat === reference_category) {
					s_intercepts[c] = 0;
					s_weights[c] = new Float64Array(num_features);
				} else {
					let block = sub_coeff[cat] || {};
					s_intercepts[c] = Math.returnSafeNumber(block._intercept, 0);
					let w = new Float64Array(num_features);
					for (let k = 0; k < num_features; k++)
						w[k] = Math.returnSafeNumber(block[valid_keys[k]], 0);
					s_weights[c] = w;
				}
			}
			sub_intercepts[m] = s_intercepts;
			sub_model_weights[m] = sub_models_data[m].weight;
			sub_weights[m] = s_weights;
		}

		if (options.landarea_raster_path && fs.existsSync(options.landarea_raster_path))
			land_raster_data = GeoPNG.loadNumberRasterImage(options.landarea_raster_path, { format: "int32" })?.data;

		passes_guard = (local_index) => {
			if (options.guard_clause)
				return options.guard_clause(local_index, rasters_obj);
			if (options.guard_type === "uninhabited" || options.mask_uninhabited) {
				let local_pop = Math.returnSafeNumber(rasters_obj["popd_"]?.data[local_index] || rasters_obj["popc_"]?.data[local_index], 0);
				if (local_pop === 0) return false;
				if (land_raster_data && land_raster_data[local_index] === 0) return false;
			}
			return true;
		};

		output_buffers = new Array(num_categories);
		for (let c = 0; c < num_categories; c++)
			output_buffers[c] = new Float32Array(total_pixels);

		local_exps = new Float64Array(num_categories);
		local_logits = new Float64Array(num_categories);

		for (let start_idx = 0; start_idx < total_pixels; start_idx += chunk_pixels) {
			let end_idx = Math.min(start_idx + chunk_pixels, total_pixels);
			for (let i = start_idx; i < end_idx; i++) {
				if (!passes_guard(i)) {
					for (let c = 0; c < num_categories; c++)
						output_buffers[c][i] = 0;
					continue;
				}

				let blended_probs = new Float64Array(num_categories);

				for (let m = 0; m < num_models; m++) {
					let mw = sub_model_weights[m];
					if (mw <= 0) continue;

					let s_intercepts = sub_intercepts[m];
					let s_weights = sub_weights[m];
					let max_l = -Infinity;

					for (let c = 0; c < num_categories; c++) {
						let cat = categories[c];
						let sum = s_intercepts[c];
						if (cat !== reference_category) {
							let w = s_weights[c];
							for (let k = 0; k < num_features; k++) {
								let fd = feature_data[k];
								if (fd) sum += fd[i]*w[k];
							}
						}
						local_logits[c] = sum;
						if (sum > max_l) max_l = sum;
					}

					let sum_exp = 0;
					for (let c = 0; c < num_categories; c++) {
						let e = Math.exp(local_logits[c] - max_l);
						local_exps[c] = e;
						sum_exp += e;
					}
					let inv_sum = (sum_exp > 0) ? (1/sum_exp) : 0;

					for (let c = 0; c < num_categories; c++)
						blended_probs[c] += mw * (local_exps[c]*inv_sum);
				}

				for (let c = 0; c < num_categories; c++)
					output_buffers[c][i] = blended_probs[c];
			}

			if (typeof Blacktraffic !== "undefined" && Blacktraffic.yield)
				await Blacktraffic.yield(0);
		}

		//Write outputs
		for (let c = 0; c < num_categories; c++) {
			let cat = categories[c];
			let local_path = output_file_path.replace(/(\.[^.]+)$/, `_class_${cat}$1`);
			await GeoPNG.saveNumberRasterImageAsync({
				data: output_buffers[c],
				file_path: local_path,
				format: "float32",
				height: height,
				width: width
			});
		}
		console.log(`Saved ${num_categories} ALR compositional probability rasters for ${output_file_path}.`);
	};
}
