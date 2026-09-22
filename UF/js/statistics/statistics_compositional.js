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
		
		//Compute scales for covariates, prepending an unscaled constant column (intercept)
		//Total feature count = K + 1 (column 0 = intercept)
		let total_K = K + 1;
		let scales = new Array(total_K).fill(1);
		
		for (let j = 0; j < K; j++) {
			let sum_sq = 0;
			for (let i = 0; i < N; i++)
				sum_sq += X[i][j]*X[i][j];
			let rms = Math.sqrt(sum_sq/N);
			scales[j + 1] = (rms > 1e-12) ? rms : 1;
		}
		
		//Build scaled design matrix X_ext where col 0 = 1.0
		let X_ext = Array.createMatrix(N, total_K);
		for (let i = 0; i < N; i++) {
			X_ext[i][0] = 1.0;
			for (let j = 0; j < K; j++)
				X_ext[i][j + 1] = X[i][j]/scales[j + 1];
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
		
		//Add ridge penalty (do not penalise intercept col 0)
		for (let j = 1; j < total_K; j++)
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
			coefficients_obj[cat] = {
				_intercept: beta_scaled[0]
			};
			for (let j = 0; j < K; j++)
				coefficients_obj[cat][keys[j]] = beta_scaled[j + 1]/scales[j + 1];
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
	 * Generates multi-class probability rasters from a trained ALR compositional model.
	 *
	 * @alias Statistics.generateALRRaster
	 *
	 * @param {string} arg0_output_file_path - Output file path prefix or base name.
	 * @param {Object} [arg1_options]
	 *  @param {Object} arg1_options.covariates_obj
	 *  @param {Object|string} arg1_options.model_obj
	 *  @param {number} [arg1_options.height=2160]
	 *  @param {number} [arg1_options.width=4320]
	 *
	 * @returns {Promise<void>}
	 */
	Statistics.generateALRRaster = async function (arg0_output_file_path, arg1_options) {
		//Convert from parameters
		let output_file_path = arg0_output_file_path;
		let options = (arg1_options) ? arg1_options : {};
		let model_obj = (typeof options.model_obj === "string") ?
			File.loadJSON(options.model_obj) : options.model_obj;
		
		//Initialise options
		let height = Math.returnSafeNumber(options.height, 2160);
		let width = Math.returnSafeNumber(options.width, 4320);
		
		//Declare local instance variables
		let categories = model_obj.categories;
		let coefficients = model_obj.coefficients || {};
		let num_categories = categories.length;
		let reference_category = model_obj.reference_category || categories[0];
		let total_pixels = width*height;
		let chunk_pixels = 100*width;
		
		let { rasters_obj, valid_keys } = Statistics.loadCovariateRasters(options.covariates_obj);
		let num_features = valid_keys.length;
		let feature_data = valid_keys.map(k => rasters_obj[k]?.data);
		
		//Pre-extract weights per category
		let category_weights = new Array(num_categories);
		let category_intercepts = new Float64Array(num_categories);
		
		for (let c = 0; c < num_categories; c++) {
			let cat = categories[c];
			if (cat === reference_category) {
				category_intercepts[c] = 0;
				category_weights[c] = new Float64Array(num_features);
			} else {
				let block = coefficients[cat] || {};
				category_intercepts[c] = Math.returnSafeNumber(block._intercept, 0);
				let w = new Float64Array(num_features);
				for (let k = 0; k < num_features; k++)
					w[k] = Math.returnSafeNumber(block[valid_keys[k]], 0);
				category_weights[c] = w;
			}
		}
		
		let output_buffers = new Array(num_categories);
		for (let c = 0; c < num_categories; c++)
			output_buffers[c] = new Float32Array(total_pixels);
		
		let local_logits = new Float64Array(num_categories);
		let local_exps = new Float64Array(num_categories);
		
		for (let start_idx = 0; start_idx < total_pixels; start_idx += chunk_pixels) {
			let end_idx = Math.min(start_idx + chunk_pixels, total_pixels);
			for (let i = start_idx; i < end_idx; i++) {
				let max_l = -Infinity;
				for (let c = 0; c < num_categories; c++) {
					let cat = categories[c];
					let sum = category_intercepts[c];
					if (cat !== reference_category) {
						let w = category_weights[c];
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
					output_buffers[c][i] = local_exps[c]*inv_sum;
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
