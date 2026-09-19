//Initialise functions
{
	if (!global.GeoPNG)
		/**
		 * Analogous to a GeoTIFF file format, but in PNG form for easier editing. Single variable. Part of Geospatiale III.
		 *
		 * @namespace GeoPNG
		 */
		global.GeoPNG = {};
	
	/**
	 * Blurs artificial administrative boundaries into smooth spatial population gradients across a timeseries sequence in parallel.
	 * @alias GeoPNG.dasymetricBlurTimeseries
	 *
	 * @param {Object} arg0_options
	 *  @param {number} [arg0_options.concurrency=4]
	 *  @param {string|Object} arg0_options.mask_raster
	 *  @param {function} arg0_options.pop_path_function - (year: number) => string.
	 *  @param {number} [arg0_options.radius=64]
	 *  @param {function} arg0_options.target_path_function - (year: number) => string.
	 *  @param {function} arg0_options.output_path_function - (year: number) => string.
	 *  @param {Array<number>} arg0_options.years - Sequence of years to process.
	 *
	 * @returns {Promise<void>}
	 */
	GeoPNG.dasymetricBlurTimeseries = async function (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Declare local instance variables
		let mask_raster = (typeof options.mask_raster === "string") ?
			GeoPNG.loadImage(options.mask_raster) : options.mask_raster;
		let radius = Math.returnSafeNumber(options.radius, 64);
		let years = options.years || [];
		
		await GeoPNG.processTimeseriesParallel({
			concurrency: options.concurrency,
			items: years,
			name: "Dasymetric Blur Timeseries",
			handler: async (year) => {
				let target_path = options.target_path_function(year);
				let pop_path = options.pop_path_function(year);
				let output_path = options.output_path_function(year);
				
				if (!fs.existsSync(target_path) || !fs.existsSync(pop_path)) return;
				
				let target_raster = await GeoPNG.loadNumberRasterImageAsync(target_path, { format: "float32" });
				let pop_raster = await GeoPNG.loadNumberRasterImageAsync(pop_path, { format: "float32" });
				
				let blurred_data = GeoPNG.dasymetricBlur({
					height: target_raster.height,
					mask_data: mask_raster.data,
					pop_data: pop_raster.data,
					radius: radius,
					target_data: target_raster.data,
					width: target_raster.width
				});
				
				await GeoPNG.saveNumberRasterImageAsync({
					data: blurred_data,
					file_path: output_path,
					format: "float32",
					height: target_raster.height,
					width: target_raster.width
				});
			}
		});
	};
	
	/**
	 * Proportionally redistributes multiple demographic/economic cohort rasters to reconcile with an anchor population raster.
	 * Supports national fallback injection for coastline and spatial boundary mismatches.
	 * @alias GeoPNG.dasymetricCohortScale
	 *
	 * @param {Object} arg0_options
	 *  @param {Object|string} arg0_options.anchor_raster - Anchor total population raster (e.g. Stadestér).
	 *  @param {Array<string>} arg0_options.cohort_keys - Keys identifying cohort surfaces.
	 *  @param {function} arg0_options.cohort_path_function - (cohort_key: string) => string.
	 *  @param {Object} [arg0_options.geocode_obj] - Map of RGB colour keys to ISO codes.
	 *  @param {Object|string} [arg0_options.geocode_raster] - Administrative geocode raster.
	 *  @param {Object} [arg0_options.national_fractions] - Map of ISO -> { [cohort_key]: fraction }.
	 *  @param {function} arg0_options.output_path_function - (cohort_key: string) => string.
	 *
	 * @returns {Promise<void>}
	 */
	GeoPNG.dasymetricCohortScale = async function (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Declare local instance variables
		let anchor_raster = (typeof options.anchor_raster === "string") ?
			GeoPNG.loadNumberRasterImage(options.anchor_raster, { format: "int32" }) : options.anchor_raster;
		let cohort_keys = options.cohort_keys || [];
		let geocode_obj = options.geocode_obj;
		let geocode_raster = (typeof options.geocode_raster === "string") ?
			GeoPNG.loadImage(options.geocode_raster) : options.geocode_raster;
		let height = anchor_raster.height;
		let national_fractions = options.national_fractions || {};
		let total_pixels = anchor_raster.width*height;
		let width = anchor_raster.width;
		
		//1. Aggregate total backcalculated surface across pixel space
		let total_backcalculated = new Float32Array(total_pixels);
		let cohort_rasters = {};
		
		for (let c = 0; c < cohort_keys.length; c++) {
			let cohort_key = cohort_keys[c];
			let cohort_path = (options.cohort_path_function) ? options.cohort_path_function(cohort_key) : null;
			let local_raster = options.cohort_rasters?.[cohort_key];
			
			if (!local_raster && cohort_path && fs.existsSync(cohort_path))
				local_raster = await GeoPNG.loadNumberRasterImageAsync(cohort_path, { format: "float32" });
			
			if (local_raster) {
				cohort_rasters[cohort_key] = local_raster;
				
				for (let i = 0; i < total_pixels; i++)
					total_backcalculated[i] += local_raster.data[i];
			}
		}
		
		//2. Scale and save each cohort asynchronously
		for (let c = 0; c < cohort_keys.length; c++) {
			let cohort_key = cohort_keys[c];
			let local_cohort = cohort_rasters[cohort_key];
			if (!local_cohort) continue;
			
			let output_path = options.output_path_function(cohort_key);
			let cohort_data = local_cohort.data;
			let output_buffer = new Float32Array(total_pixels);
			
			for (let idx = 0; idx < total_pixels; idx++) {
				let anchor_pop = anchor_raster.data[idx];
				
				//If anchor explicitly states 0, strictly clamp to 0
				if (anchor_pop <= 0) {
					output_buffer[idx] = 0;
					continue;
				}
				
				let backcalc_total = total_backcalculated[idx];
				let cohort_val = cohort_data[idx];
				
				//Scenario A: Pre-existing backcalculated population footprint
				if (backcalc_total > 0) {
					output_buffer[idx] = (cohort_val/backcalc_total)*anchor_pop;
					continue;
				}
				
				//Scenario B: Anchor asserts population exists, but local auxiliary is 0 (coastline mismatch)
				if (geocode_raster && geocode_obj) {
					let byte_index = idx*4;
					let colour_key = [
						geocode_raster.data[byte_index],
						geocode_raster.data[byte_index + 1],
						geocode_raster.data[byte_index + 2]
					].join(",");
					
					let local_geocodes = geocode_obj[colour_key];
					if (local_geocodes) {
						let injected = false;
						for (let x = 0; x < local_geocodes.length; x++) {
							let iso = local_geocodes[x];
							let fraction = national_fractions[iso]?.[cohort_key];
							if (fraction !== undefined) {
								output_buffer[idx] = anchor_pop*fraction;
								injected = true;
								break;
							}
						}
						if (injected) continue;
					}
				}
				
				output_buffer[idx] = 0;
			}
			
			await GeoPNG.saveNumberRasterImageAsync({
				data: output_buffer,
				file_path: output_path,
				format: "float32",
				height: height,
				width: width
			});
		}
	};
	
	/**
	 * Scales an auxiliary surface to match target regional aggregates per spatial zone.
	 * Formula: V_i_new = V_i * (T_target / sum(V_k)).
	 * @alias GeoPNG.dasymetricScale
	 *
	 * @param {Object} arg0_options
	 *  @param {Float64Array|number[]} arg0_options.data - Pixel data buffer to scale in-place or copy.
	 *  @param {Object} arg0_options.mask_pixel_indices - Map of region_key -> Array<pixel_index>.
	 *  @param {Object} arg0_options.targets - Map of region_key -> target total number.
	 *
	 * @returns {Float64Array} Dasymetrically scaled pixel buffer.
	 */
	GeoPNG.dasymetricScale = function (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Declare local instance variables
		let data = options.data;
		let mask_pixel_indices = options.mask_pixel_indices || {};
		let output_data = new Float64Array(data);
		let targets = options.targets || {};
		
		Object.iterate(mask_pixel_indices, (region_key, indices) => {
			let target_val = targets[region_key];
			if (target_val === undefined || target_val <= 0 || indices.length === 0) return;
			
			let current_sum = 0;
			for (let i = 0; i < indices.length; i++)
				current_sum += data[indices[i]];
			
			if (current_sum > 0) {
				let scalar = target_val/current_sum;
				for (let i = 0; i < indices.length; i++) {
					let idx = indices[i];
					output_data[idx] = data[idx]*scalar;
				}
			}
		});
		
		//Return statement
		return output_data;
	};
	
	/**
	 * Applies C1-continuous log-tail regularisation and robust IQR outlier management to a raster surface.
	 * Prevents explosive statistical boundaries while preserving local variance.
	 * @alias GeoPNG.regulariseLogTail
	 *
	 * @param {Object} arg0_options
	 *  @param {Float64Array|number[]} arg0_options.data - Input raster data.
	 *  @param {boolean} [arg0_options.fraction_only=false] - If true, outputs normalised [0, 1] fractions.
	 *  @param {number} [arg0_options.iqr_multiplier=1.5] - Multiplier on IQR to set outlier thresholds.
	 *  @param {boolean} [arg0_options.return_metadata=false] - If true, returns { data, reg_min, reg_max, reg_range, regularise }.
	 *  @param {number} [arg0_options.target_max] - Target maximum value to map regularised range to.
	 *  @param {number} [arg0_options.target_min] - Target minimum value to map regularised range to.
	 *  @param {function} [arg0_options.valid_filter] - (index: number) => boolean. If provided, restricts distribution analysis.
	 *
	 * @returns {Float64Array|Object} Regularised pixel data buffer or metadata object if return_metadata is true.
	 */
	GeoPNG.regulariseLogTail = function (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Initialise options
		let fraction_only = (options.fraction_only) ? true : false;
		let iqr_multiplier = Math.returnSafeNumber(options.iqr_multiplier, 1.5);
		let target_max = options.target_max;
		let target_min = options.target_min;
		let valid_filter = options.valid_filter;
		
		//Declare local instance variables
		let data = options.data;
		let n = data.length;
		let output_data = new Float64Array(n);
		let valid_samples = [];
		
		for (let i = 0; i < n; i++) {
			let val = data[i];
			if (!isNaN(val) && val > 0) {
				if (!valid_filter || valid_filter(i))
					valid_samples.push(val);
			}
		}
		
		let sample_count = valid_samples.length;
		if (sample_count === 0) {
			if (options.return_metadata)
				return {
					alpha: 0.01,
					data: output_data,
					reg_max: 1,
					reg_min: 0,
					reg_range: 1,
					regularise: (x) => x,
					t_lower: 0,
					t_upper: 1
				};
			return output_data;
		}
		
		//Robust quantile sorting
		valid_samples.sort((a, b) => a - b);
		
		let q1 = valid_samples[Math.floor(sample_count*0.25)];
		let q3 = valid_samples[Math.floor(sample_count*0.75)];
		let iqr = q3 - q1;
		
		//Calculate standard deviation
		let sum = 0;
		for (let i = 0; i < sample_count; i++) sum += valid_samples[i];
		let mean = sum/sample_count;
		
		let sq_sum = 0;
		for (let i = 0; i < sample_count; i++) sq_sum += Math.pow(valid_samples[i] - mean, 2);
		let std = Math.sqrt(sq_sum/sample_count);
		
		let alpha = (iqr > 1e-5) ? iqr : ((std > 1e-5) ? std : 0.01);
		let t_lower = q1 - (iqr_multiplier*alpha);
		let t_upper = q3 + (iqr_multiplier*alpha);
		
		let regulariseValue = (x) => {
			if (x > t_upper) return t_upper + alpha*Math.log(1 + ((x - t_upper)/alpha));
			if (x < t_lower) return t_lower - alpha*Math.log(1 + ((t_lower - x)/alpha));
			return x;
		};
		
		let reg_min = regulariseValue(valid_samples[0]);
		let reg_max = regulariseValue(valid_samples[sample_count - 1]);
		let reg_range = reg_max - reg_min;
		if (reg_range === 0) reg_range = 1;
		
		let has_target_bounds = (target_min !== undefined && target_max !== undefined);
		let target_range = has_target_bounds ? (target_max - target_min) : 0;
		
		for (let i = 0; i < n; i++) {
			let val = data[i];
			if (val <= 0 || isNaN(val) || (valid_filter && !valid_filter(i))) {
				output_data[i] = 0;
			} else {
				let reg_val = regulariseValue(val);
				
				if (has_target_bounds) {
					output_data[i] = (reg_range === 0) ? target_min : (target_min + ((reg_val - reg_min)/reg_range)*target_range);
				} else if (fraction_only) {
					output_data[i] = (reg_val - reg_min)/reg_range;
				} else {
					output_data[i] = reg_val;
				}
			}
		}
		
		//Return statement
		if (options.return_metadata)
			return {
				alpha: alpha,
				data: output_data,
				reg_max: reg_max,
				reg_min: reg_min,
				reg_range: reg_range,
				regularise: regulariseValue,
				t_lower: t_lower,
				t_upper: t_upper
			};
		return output_data;
	};
}
