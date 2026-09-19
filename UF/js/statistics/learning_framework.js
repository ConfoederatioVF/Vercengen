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
						Geospatiale.getEquirectangularCoordsPixel(lng_val, lat_val, { width: raster.width, height: raster.height });
					
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
			let mode = options.mode || ((model_obj.type === "multinomial_logit") ? "multinomial_logit" : "ols");
			options.height = Math.returnSafeNumber(options.height, 2160);
			options.width = Math.returnSafeNumber(options.width, 4320);
			if (!options.formatting_parameters) options.formatting_parameters = [];
			
			//Declare local instance variables
			let { rasters_obj, valid_keys } = Statistics.loadCovariateRasters(options.covariates_obj, {
				formatting_parameters: options.formatting_parameters
			});
			
			let passes_guard = (local_index) => {
				if (options.guard_clause)
					return options.guard_clause(local_index, rasters_obj);
				return true;
			};
			
			//Branch based on mode
			if (mode === "multinomial_logit") {
				let output_mode = options.output_mode || "class";
				let get_probabilities = (local_index) => {
					let local_values = valid_keys.map((key) => {
						let r = rasters_obj[key];
						return (r?.data) ? r.data[local_index] : 0;
					});
					
					return Statistics.predictMultinomialProbabilities(
						Object.fromArrays(valid_keys, local_values), model_obj
					);
				};
				
				if (output_mode === "class") {
					let format = options.format || "int32";
					
					GeoPNG.saveNumberRasterImage({
						file_path: output_file_path,
						format: format,
						height: options.height,
						width: options.width,
						function: (local_index) => {
							if (!passes_guard(local_index)) return 0;
							return Statistics.argmaxMultinomialClass(
								get_probabilities(local_index), model_obj.classes
							);
						}
					});
					
					console.log(`Saved multinomial class raster for ${output_file_path}.`);
				} else if (output_mode === "probability" || output_mode === "probabilities") {
					let is_single = (output_mode === "probability");
					let target_classes = is_single ?
						[String(options.class)] : model_obj.classes.map(c => String(c));
					
					for (let c = 0; c < target_classes.length; c++) {
						let local_class = target_classes[c];
						let local_path = is_single ?
							output_file_path : output_file_path.replace(/(\.[^.]+)$/, `_class_${local_class}$1`);
						
						GeoPNG.saveNumberRasterImage({
							file_path: local_path,
							format: "float32",
							height: options.height,
							width: options.width,
							function: (local_index) => {
								if (!passes_guard(local_index)) return 0;
								return get_probabilities(local_index)[local_class] || 0;
							}
						});
						
						console.log(`Saved probability raster (class ${local_class}) for ${local_path}.`);
					}
				}
			} else {
				//Mode 'ols': linear dot product of covariates and coefficients
				let coefficients_obj = model_obj.coefficients || {};
				let format = options.format || "float32";
				
				GeoPNG.saveNumberRasterImage({
					file_path: output_file_path,
					format: format,
					height: options.height,
					width: options.width,
					function: (local_index) => {
						if (!passes_guard(local_index)) return 0;
						
						let local_sum = 0;
						for (let k = 0; k < valid_keys.length; k++) {
							let key = valid_keys[k];
							let r = rasters_obj[key];
							let coeff = Math.returnSafeNumber(coefficients_obj[key]);
							
							if (r?.data) local_sum += r.data[local_index]*coeff;
						}
						
						return local_sum;
					}
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
