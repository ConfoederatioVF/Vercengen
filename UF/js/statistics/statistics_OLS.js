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
	 * Computes the X^T * X matrix manually to save memory.
	 * @alias Statistics._computeXT_X
	 *
	 * @param {Array<Array<number>>} arg0_X
	 *
	 * @returns {Array<Array<number>>}
	 */
	Statistics._computeXT_X = function (arg0_X) {
		let X = arg0_X;
		let N = X.length;
		let K = X[0].length;
		
		let XT_X = Array.createMatrix(K, K);
		
		//Optimisation: Halved loop multiplications taking advantage of reflectional symmetry
		for (let i = 0; i < N; i++) {
			let rowX = X[i];
			for (let j = 0; j < K; j++) {
				let x_j = rowX[j];
				for (let k = j; k < K; k++) {
					XT_X[j][k] += x_j * rowX[k];
				}
			}	
		}
		
		//Mirror the computed lower half logic to the upper half logic
		for (let j = 0; j < K; j++) {
			for (let k = 0; k < j; k++) {
				XT_X[j][k] = XT_X[k][j];
			}
		}
		
		return XT_X;
	};
	
	/**
	 * Computes the VIF of a given matrix.
	 * @alias Statistics.computeVIF
	 *
	 * @param {Matrix|Array} arg0_X
	 *
	 * @returns {Array<number>}
	 */
	Statistics.computeVIF = function (arg0_X) {
		//Convert from parameters
		let X = arg0_X;
		try { X = X._data || X; } catch (e) {}
		
		//Declare local instance variables
		let XT_X = Statistics._computeXT_X(X);
		let XT_X_inv = mathjs.inv(XT_X);
		try { XT_X_inv = XT_X_inv._data || XT_X_inv; } catch(e) {}
		
		let vif = XT_X_inv.map((row, i) => row[i]);
		
		//Return statement
		return vif;
	};
	
	/**
	 * Returns the condition number of a given matrix.
	 * @alias Statistics.conditionNumber
	 *
	 * @param {Matrix|Array} arg0_X
	 * @param {number} [arg1_epsilon=1e-12]
	 *
	 * @returns {number}
	 */
	Statistics.conditionNumber = function (arg0_X, arg1_epsilon) {
		//Convert from parameters
		let X = arg0_X;
		let epsilon = Math.returnSafeNumber(arg1_epsilon, 1e-12);
		try { X = X._data || X; } catch (e) {}
		
		//Declare local instance variables
		let XT_X = Statistics._computeXT_X(X);
		
		let matrix = new ml_matrix.SVD(XT_X, { autoTranspose: true });
		let singular_values = matrix.diagonal.map(v => Math.sqrt(Math.max(0, v)));
		
		//Find max and min singular values
		let max_s = Math.max(...singular_values);
		let min_s = Math.max(Math.min(...singular_values), epsilon); //Ensure min_s is never 0
		
		//Return statement
		return max_s/min_s;
	};
	
	/**
	 * Geometrically average OLS models across a folder path, with base OLS prefixes.
	 * @alias Statistics.geomeanOLSModels
	 * 
	 * @param {string} arg0_input_folder_path
	 * @param {string} arg1_ols_prefix
	 * @param {Object} [arg2_options]
	 *  @param {function} [arg2_options.weighting_function] - (arg0_coefficient:{@link number}) | {@link number}
	 *  
	 * @returns {Promise<{coefficients: {}, raw_coefficients: {}}>}
	 */
	Statistics.geomeanOLSModels = async function (arg0_input_folder_path, arg1_ols_prefix, arg2_options) { 
		let input_folder_path = arg0_input_folder_path;
		let ols_prefix = arg1_ols_prefix;
		let options = (arg2_options) ? arg2_options : {};
		
		//Declare local instance variables
		let all_coefficients = {};
		let raw_coefficients = {};
		
		//Iterate over all_input_files matching ols_prefix
		let all_input_files = await File.getAllFiles(input_folder_path);
		
		for (let i = 0; i < all_input_files.length; i++)
			if (all_input_files[i].endsWith(".json")) {
				let local_split_path = all_input_files[i].split(/[/\\]/);
				let local_file_name = local_split_path[local_split_path.length - 1];
				
				if (local_file_name.startsWith(ols_prefix)) {
					let rawdata = JSON.parse(fs.readFileSync(all_input_files[i], "utf8"));
					let { coefficients } = rawdata;
					
					//Aggregate coefficients for geometric mean calculation
					for (let key in coefficients) {
						if (!all_coefficients[key]) all_coefficients[key] = [];
						if (!raw_coefficients[key]) raw_coefficients[key] = [];
						all_coefficients[key].push(coefficients[key]);
						raw_coefficients[key].push(coefficients[key]);
					}
				}
			}
		
		//Iterate over all_coefficients; compute geometric mean for each coefficient
		let format_slug = ols_prefix.split("_").join(" ").trim().split(" ").join("_");
		let hybrid_coefficients = {};
		
		for (let key in all_coefficients) {
			hybrid_coefficients[key] = Math.weightedGeometricMean(all_coefficients[key]);
			if (options.weighting_function)
				hybrid_coefficients[key] = options.weighting_function(hybrid_coefficients[key]);
		}
		
		let output_data = {
			coefficients: hybrid_coefficients,
			raw_coefficients
		};
		let output_path = `${input_folder_path}/geomean_${format_slug}.json`;
		
		fs.writeFileSync(output_path, JSON.stringify(output_data, null, 2));
		console.log(`OLS weighted geometric mean calculated and saved to ${output_path}.`);
		
		//Return statement
		return output_data;
	};
	
	/**
	 * Generates an OLS raster from a stack of coefficients.
	 * @alias Statistics.generateOLSRaster
	 * 
	 * @param {string} arg0_output_file_path
	 * @param {Object} [arg1_options]
	 *  @param {Object} arg1_options.covariates_obj
	 *  @param {string} [arg1_options.format="int32"]
	 *  @param {Array} [arg1_options.formatting_parameters]
	 *  @param {function} [arg1_options.guard_clause] - (local_index:{@link number}, rasters_obj:{@link Object}) - `false` skips pixel processing.
	 *  @param {Object|string} [arg1_options.model_obj] - File path or JSON object.
	 *  @param {string} [arg1_options.utility_format="int32"]
	 *  
	 *  @param {number} [arg1_options.height=2160]
	 *  @param {number} [arg1_options.width=4320]
	 * 
	 * @returns {Promise<void>}
	 */
	Statistics.generateOLSRaster = async function (arg0_output_file_path, arg1_options) {
		//Convert from parameters
		let output_file_path = arg0_output_file_path;
		let options = (arg1_options) ? arg1_options : {};
		
		//Return statement
		return await Statistics.LearningFramework.predictRaster(output_file_path, options.model_obj, {
			...options,
			mode: "ols"
		});
	};
	
	/**
	 * Loads a stack of covariates for a specific utility file path for OLS training.
	 * @alias Statistics.loadOLSCovariates
	 *
	 * @param {string} arg0_utility_file_path
	 * @param {Object} [arg1_options]
	 *  @param {Object} arg1_options.covariates_obj
	 *  @param {any[]} [arg1_options.formatting_parameters]
	 *  @param {string} [arg1_options.utility_format="int32"]
	 *  
	 * @returns {Promise<Object>}
	 */
	Statistics.loadOLSCovariates = async function (arg0_utility_file_path, arg1_options) {
		//Convert from parameters
		let utility_file_path = arg0_utility_file_path;
		let options = (arg1_options) ? arg1_options : {};
		
		//Return statement
		return await Statistics.LearningFramework.extractImageDataset(utility_file_path, {
			...options,
			mode: "ols"
		});
	};
	
	/**
	 * Loads a stack of covariates for point-based data for OLS training for a specific year.
	 * @alias Statistics.loadPointOLSCovariates
	 *
	 * @param {Array<Object>} arg0_points - Array of objects with { coords: [lng, lat], target: number, year: number }
	 * @param {number} arg1_year - The target year to load covariates and sample points for.
	 * @param {Object} [arg2_options]
	 *  @param {Object} arg2_options.covariates_obj
	 *  @param {number} [arg2_options.covariates_year] - Mapped year to override path resolution.
	 *  @param {Function} [arg2_options.get_pixel_function] - Custom coordinate-to-pixel mapping function.
	 *
	 * @returns {Promise<Object>}
	 */
	Statistics.loadPointOLSCovariates = async function (arg0_points, arg1_year, arg2_options) {
		//Convert from parameters
		let points_list = arg0_points;
		let target_year = arg1_year;
		let options = (arg2_options) ? arg2_options : {};
		
		//Return statement
		return await Statistics.LearningFramework.extractPointDataset(points_list, target_year, options);
	};
	
	/**
	 * Processes and adjusts OLS model coefficients against target and covariate rasters using Multiplicative Update Rules (NMF).
	 * @alias Statistics.processOLSModel
	 *
	 * @param {string|Object} arg0_model - JSON model object or file path to JSON model.
	 * @param {Object} [arg1_options]
	 *  @param {Object} [arg1_options.covariates_obj] - Map of covariate keys to functions or file paths.
	 *  @param {boolean} [arg1_options.debug=false]
	 *  @param {string} [arg1_options.output_file_path] - Path to save the adjusted model JSON.
	 *  @param {Array<any>|any} [arg1_options.steps] - Array of steps or parameter sets (e.g., years) passed into target and covariate functions.
	 *  @param {string|Function} [arg1_options.target] - File path or function returning file path for target raster.
	 *  @param {string} [arg1_options.target_format="float32"]
	 *
	 * @returns {Promise<Object>}
	 */
	Statistics.processOLSModel = async function (arg0_model, arg1_options) {
		//Convert from parameters
		let processed_model = File.loadJSON(arg0_model);
		let options = (arg1_options) ? arg1_options : {};
		
		//Initialise options
		let covariates_obj = (options.covariates_obj) ? options.covariates_obj : {};
		let target_entry = (options.target) ? options.target : options.target_raster;
		let steps = (options.steps) ? (Array.isArray(options.steps) ? options.steps : [options.steps]) : [[]];
		
		//Ensure all coefficients are positive
		let all_coefficients = Object.keys(processed_model.coefficients);
		
		for (let i = 0; i < all_coefficients.length; i++)
			processed_model.coefficients[all_coefficients[i]] = Math.abs(processed_model.coefficients[all_coefficients[i]]);
		
		//Iterate over formatting parameters steps
		for (let i = 0; i < steps.length; i++) try {
			let current_params = Array.isArray(steps[i]) ? steps[i] : [steps[i]];
			console.log(`Processing OLS model adjustment for step [${current_params.join(", ")}] ..`);
			
			let local_target_file_path = (typeof target_entry === "function") ? target_entry(...current_params) : target_entry;
			let local_target_format = options.target_format || "float32";
			
			if (Array.isArray(local_target_file_path)) {
				local_target_format = local_target_file_path[1];
				local_target_file_path = local_target_file_path[0];
			}
			
			let local_covariate_images = {};
			let valid_covariate_keys = [];
			
			for (let key in covariates_obj) {
				let covariate_entry = covariates_obj[key];
				let local_file_path = (typeof covariate_entry === "function") ? covariate_entry(...current_params) : covariate_entry;
				let local_format = "float32";
				
				if (Array.isArray(local_file_path)) {
					local_format = local_file_path[1];
					local_file_path = local_file_path[0];
				}
				
				try {
					local_covariate_images[key] = GeoPNG.loadNumberRasterImage(local_file_path, {
						format: local_format
					});
					valid_covariate_keys.push(key);
				} catch (e) {
					console.warn(`- [WARN] Missing covariate raster for ${key} at ${local_file_path}. Filtering out key.`);
				}
			}
			
			let local_target_image = GeoPNG.loadNumberRasterImage(local_target_file_path, {
				format: local_target_format
			});
			
			//Guard clause if no valid_covariate_keys present
			if (valid_covariate_keys.length === 0) {
				console.warn(`- [WARN] No covariate keys for step [${current_params.join(", ")}]! Skipping iteration.`);
				continue;
			}
			
			//Initialise accumulators for Multiplicative Update Rule
			let numerators = {};
			let denominators = {};
			for (let k = 0; k < valid_covariate_keys.length; k++) {
				numerators[valid_covariate_keys[k]] = 0;
				denominators[valid_covariate_keys[k]] = 0;
			}
			
			//Iterate over all pixels
			console.log(`- Aggregating global gradients (Multiplicative Update) ..`);
			let pixel_count = local_target_image.width * local_target_image.height;
			
			for (let x = 0; x < pixel_count; x++) {
				let observed_value = local_target_image.data[x] || 0;
				if (isNaN(observed_value)) observed_value = 0;
				
				//Compute total predicted_value for this pixel
				let predicted_value = 0;
				for (let k = 0; k < valid_covariate_keys.length; k++) {
					let key = valid_covariate_keys[k];
					let covariate_value = local_covariate_images[key].data[x] || 0;
					if (isNaN(covariate_value)) covariate_value = 0;
					
					let coefficient = processed_model.coefficients[key] || 0;
					predicted_value += covariate_value * coefficient;
				}
				
				//If there is data interaction in this pixel, accumulate global sums
				if (predicted_value > 0 || observed_value > 0) {
					for (let k = 0; k < valid_covariate_keys.length; k++) {
						let key = valid_covariate_keys[k];
						let covariate_value = local_covariate_images[key].data[x] || 0;
						
						if (isNaN(covariate_value) || covariate_value === 0) continue;
						
						numerators[key] += observed_value * covariate_value;
						denominators[key] += predicted_value * covariate_value;
					}
				}
			}
			
			//Apply exact multiplicative updates
			console.log(`- Applying global scaling multipliers ..`);
			for (let k = 0; k < valid_covariate_keys.length; k++) {
				let key = valid_covariate_keys[k];
				
				if (denominators[key] > 0) {
					// Mathematically optimal ratio for this step
					let multiplier = numerators[key] / denominators[key];
					processed_model.coefficients[key] *= multiplier;
					
					if (options.debug) {
						console.log(`  - ${key}: Numerator: ${numerators[key].toExponential(2)}, Denominator: ${denominators[key].toExponential(2)} -> Multiplier: ${multiplier.toFixed(5)}`);
					}
				} else if (denominators[key] === 0 && numerators[key] > 0) {
					// Edge case: Model predicted 0, but target exists. 
					// (Very rare if initial OLS coefficients > 0)
					if (options.debug) console.log(`  - ${key}: Missed prediction. Numerator > 0 but Denominator is 0.`);
				}
			}
			
			await Blacktraffic.yield();
			console.log(`- New coefficients:`, processed_model.coefficients);
		} catch (e) {
			console.error(`Statistics.processOLSModel(): Error when processing step:`);
			console.error(e);
		}
		
		//Save adjusted coefficients if output_file_path is provided
		if (options.output_file_path) {
			let output_file_path = path.resolve(options.output_file_path);
			fs.writeFileSync(output_file_path, JSON.stringify(processed_model, null, 2));
			console.log(`Processed model data saved successfully in ${output_file_path}.`);
		}
		
		//Return statement
		return processed_model;
	};
	
	/**
	 * Removes high VIF features for a given matrix.
	 * @alias Statistics.removeHighVIFFeatures
	 *
	 * @param {Matrix|Array} arg0_X
	 * @param {number} [arg1_threshold=10]
	 *
	 * @returns {Array<Array<number>>}
	 */
	Statistics.removeHighVIFFeatures = function (arg0_X, arg1_threshold) {
		//Convert from parameters
		let X = arg0_X;
		let threshold = Math.returnSafeNumber(arg1_threshold, 10);
		try { X = X._data || X; } catch(e) {}
		
		//Declare local instance variables
		let vif_scores = Statistics.computeVIF(X);
		let to_keep = vif_scores.map((vif, i) => (vif < threshold));
		
		//Return statement
		return X.map((row) => row.filter((_, index) => to_keep[index]));
	};
	
	/**
	 * Performs Ridge Regression on two matrices with RMS scale stabilization and pseudo-inverse fallbacks.
	 * @alias Statistics.ridgeRegression
	 *
	 * @param {Matrix|Array} arg0_X
	 * @param {Matrix|Array} arg1_Y
	 * @param {number} [arg2_lambda=1e-3]
	 *
	 * @returns {Matrix|Array}
	 */
	Statistics.ridgeRegression = function (arg0_X, arg1_Y, arg2_lambda) {
		//Convert from parameters
		let X = arg0_X;
		let Y = arg1_Y;
		let lambda = Math.returnSafeNumber(arg2_lambda, 1e-3);
		
		try { X = X._data || X; } catch (e) {}
		try { Y = Y._data || Y; } catch (e) {}
		
		//Declare local instance variables
		let N = X.length;
		if (N === 0) return [];
		
		let K = X[0].length;
		if (K === 0) return [];
		
		//Compute column-wise RMS scales to prevent scale-mismatch singularity
		let scales = new Array(K).fill(1);
		let X_scaled = Array.createMatrix(N, K);
		
		for (let j = 0; j < K; j++) {
			let sum_sq = 0;
			for (let i = 0; i < N; i++) {
				sum_sq += X[i][j] * X[i][j];
			}
			let rms = Math.sqrt(sum_sq / N);
			scales[j] = (rms > 1e-12) ? rms : 1;
		}
		
		//Scale covariates
		for (let i = 0; i < N; i++) {
			for (let j = 0; j < K; j++) {
				X_scaled[i][j] = X[i][j] / scales[j];
			}
		}
		
		let XT_X = Array.createMatrix(K, K);
		let XT_Y = Array.createMatrix(K, 1);
		
		for (let i = 0; i < N; i++) {
			let row_X = X_scaled[i];
			let y_val = Y[i][0];
			for (let j = 0; j < K; j++) {
				let x_j = row_X[j];
				XT_Y[j][0] += x_j * y_val;
				for (let k = j; k < K; k++) {
					XT_X[j][k] += x_j * row_X[k];
				}
			}
		}
		
		for (let j = 0; j < K; j++) {
			for (let k = 0; k < j; k++) {
				XT_X[j][k] = XT_X[k][j];
			}
		}
		
		let XT_X_mat = mathjs.matrix(XT_X);
		let XT_Y_mat = mathjs.matrix(XT_Y);
		let identity = mathjs.identity(K);
		let XT_X_reg = mathjs.add(XT_X_mat, mathjs.multiply(identity, lambda)); //Ridge term
		
		//Attempt standard inverse; fall back to Moore-Penrose pseudo-inverse (pinv) if determinant is zero
		let beta_scaled;
		try {
			beta_scaled = mathjs.multiply(mathjs.inv(XT_X_reg), XT_Y_mat);
		} catch (e) {
			console.log(`- Determinant is zero or matrix is near-singular. Falling back to Moore-Penrose pseudo-inverse.`);
			beta_scaled = mathjs.multiply(mathjs.pinv(XT_X_reg), XT_Y_mat);
		}
		
		//Convert scaled coefficients back to original covariate scale: beta_j = beta_scaled_j / scale_j
		let beta_scaled_arr = Array.unwrapMatrix(beta_scaled);
		let beta_orig = Array.createMatrix(K, 1);
		
		for (let j = 0; j < K; j++) {
			beta_orig[j][0] = beta_scaled_arr[j][0] / scales[j];
		}
		
		//Return statement; return beta matrix
		return mathjs.matrix(beta_orig);
	};
	
	/**
	 * Trains a raster-based OLS model given a fitted covariates object { X, Y, keys }.
	 * @alias Statistics.trainOLSModel
	 *
	 * @param {string} arg0_output_file_path
	 * @param {Object} arg1_covariates_obj
	 * @param {Object} [arg2_options]
	 *  @param {boolean} [arg2_options.dynamic_lambda=false] - Condition numbers are dynamically selected if true.
	 *  @param {number} [arg2_options.lambda=1e9]
	 *  @param {boolean} [arg2_options.remove_high_vif_features=false] - Whether to remove high VIF features.
	 *  @param {string} [arg2_options.key]
	 *  @param {function} [arg2_options.weighting_function] - (arg0_coefficient:{@link number}) | {@link number}
	 *
	 * @returns {Promise<Object>}
	 */
	Statistics.trainOLSModel = async function (arg0_output_file_path, arg1_covariates_obj, arg2_options) {
		//Convert from parameters
		let output_file_path = path.resolve(arg0_output_file_path);
		let covariates_obj = arg1_covariates_obj;
		let options = (arg2_options) ? arg2_options : {};
		
		//Initialise options
		if (!options.key) options.key = output_file_path;
		
		//Declare local instance variables
		let basename = path.basename(output_file_path);
		let { keys, X, Y } = covariates_obj;
		
		console.log(`- Performing OLS for ${basename}.`);
		
		if (!X || X.length === 0 || !keys || keys.length === 0) {
			console.warn(`- Empty covariate data passed for ${basename}. Skipping.`);
			return null;
		}
		
		//1. Remove multicollinear features using VIF selection if specified
		if (options.remove_high_vif_features) {
			X = Statistics.removeHighVIFFeatures(X, 10);
			console.log(` - Removed high VIF features.`);
		}
		
		//2. Apply Ridge Regression to stabilise coefficients
		let selected_lambda = Math.returnSafeNumber(options.lambda, 1e9);
		console.log(`- Computed preliminary matrices.`);
		
		if (options.dynamic_lambda) {
			let condition_number = Statistics.conditionNumber(X);
			condition_number *= 1e3;
			console.log(`- Condition Number: ${condition_number}, using Lambda = ${selected_lambda}`);
		}
		
		let beta = Statistics.ridgeRegression(X, Y, selected_lambda);
		
		if (!beta || beta.length === 0) {
			console.warn(`- Regression failed to produce beta coefficients for ${basename}.`);
			return null;
		}
		
		console.log(`- Applied Ridge Regression to stabilise coefficients.`);
		
		//3. Convert coefficients to JSON
		let beta_arr = Array.unwrapMatrix(beta);
		let coefficients = beta_arr.flat();
		console.log(`- Computed coefficients.`);
		
		//Save model to JSON
		let model_data_obj = {
			key: options.key,
			coefficients: Object.fromEntries(
				keys.map((key, i) => [
					key,
					(options.weighting_function) ?
						options.weighting_function(coefficients[i]) : coefficients[i]]
				)
			)
		};
		
		fs.writeFileSync(output_file_path, JSON.stringify(model_data_obj, null, 2));
		console.log(`OLS model data for ${options.key} saved successfully in ${output_file_path}.`);
		
		//Return statement
		return model_data_obj;
	};
}