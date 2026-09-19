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
	 * Pre-indexes pixel indices and calculates total land area for each partition defined in areal_masks.
	 * Caches spatial topology to avoid redundant O(N) pixel loops across multi-year timeseries.
	 * @alias GeoPNG.indexArealMasks
	 *
	 * @param {Object} arg0_options
	 *  @param {Object} arg0_options.areal_masks - Metadata dictionary defining masks and colour keys.
	 *  @param {Object|string} arg0_options.land_area_raster - Land area raster object or file path.
	 *  @param {Array<Object|string>} arg0_options.mask_rasters - Array of raster objects or file paths.
	 *  @param {boolean} [arg0_options.ignore_zero_land=true] - Skip pixels with zero or negative land area.
	 *
	 * @returns {Object} { mask_areas: Object, mask_pixel_indices: Object, total_pixels: number, width: number, height: number }
	 */
	GeoPNG.indexArealMasks = function (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Declare local instance variables
		let areal_masks = options.areal_masks || {};
		let ignore_zero_land = (options.ignore_zero_land !== undefined) ? options.ignore_zero_land : true;
		let land_area_raster = (typeof options.land_area_raster === "string") ?
			GeoPNG.loadNumberRasterImage(options.land_area_raster, { format: "float32" }) : options.land_area_raster;
		let mask_rasters = (options.mask_rasters || []).map((r) =>
			(typeof r === "string") ? GeoPNG.loadImage(r) : r
		);
		
		let all_mask_keys = Object.keys(areal_masks);
		let height = land_area_raster.height;
		let land_data = land_area_raster.data;
		let mask_areas = {};
		let mask_pixel_indices = {};
		let total_pixels = land_area_raster.width*height;
		let width = land_area_raster.width;
		
		//Initialise storage for each non-clone mask
		for (let i = 0; i < all_mask_keys.length; i++) {
			let mask_key = all_mask_keys[i];
			let mask_entry = areal_masks[mask_key];
			
			if (!mask_entry.is_clone) {
				let resolved_key = mask_entry.key || mask_key;
				mask_pixel_indices[resolved_key] = [];
				mask_areas[resolved_key] = 0;
			}
		}
		
		//Pre-index pixel indices and calculate total mask areas across pixel space
		for (let idx = 0; idx < total_pixels; idx++) {
			let cell_area = land_data[idx];
			if (ignore_zero_land && cell_area <= 0) continue;
			
			let byte_index = idx*4;
			let seen_keys = new Set();
			
			for (let y = 0; y < mask_rasters.length; y++) {
				let local_raster = mask_rasters[y];
				let color_key = [
					local_raster.data[byte_index],
					local_raster.data[byte_index + 1],
					local_raster.data[byte_index + 2]
				].join(",");
				
				let local_area_mask = areal_masks[color_key];
				if (local_area_mask) {
					let target_key = local_area_mask.key || color_key;
					
					if (mask_pixel_indices[target_key] && !seen_keys.has(target_key)) {
						mask_pixel_indices[target_key].push(idx);
						mask_areas[target_key] += (cell_area > 0 ? cell_area : 1);
						seen_keys.add(target_key);
					}
				}
			}
		}
		
		//Return statement
		return {
			height: height,
			mask_areas: mask_areas,
			mask_pixel_indices: mask_pixel_indices,
			total_pixels: total_pixels,
			width: width
		};
	};
	
	/**
	 * Applies areal scaling or non-linear constraint clamping to a raster surface.
	 * Supports linear proportional scaling as well as variance-preserving logit adjustments.
	 * @alias GeoPNG.applyArealClamping
	 *
	 * @param {Object} arg0_options
	 *  @param {Float64Array|number[]} arg0_options.data - Input raster data.
	 *  @param {Object} arg0_options.mask_pixel_indices - Pre-indexed pixels per region key.
	 *  @param {Object} [arg0_options.mask_areas] - Pre-indexed land areas per region key.
	 *  @param {string} [arg0_options.mode="linear"] - 'linear' | 'variance_preserving_logit'.
	 *  @param {Object} arg0_options.targets - Map of region key to target values.
	 *  @param {Float64Array|number[]} [arg0_options.weights] - Pixel weights (e.g. population or GDP) for weighted aggregations.
	 *  @param {number} [arg0_options.max_iterations=50] - Binary search iterations for logit shift.
	 *
	 * @returns {Float64Array} Clamped pixel data.
	 */
	GeoPNG.applyArealClamping = function (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Initialise options
		let mode = options.mode || "linear";
		let max_iterations = Math.returnSafeNumber(options.max_iterations, 50);
		
		//Declare local instance variables
		let input_data = options.data;
		let mask_pixel_indices = options.mask_pixel_indices || {};
		let output_data = new Float64Array(input_data);
		let targets = options.targets || {};
		let weights = options.weights;
		
		if (mode === "variance_preserving_logit") {
			//Determine domain valid range
			let valid_max = -Infinity;
			let valid_min = Infinity;
			
			for (let i = 0; i < input_data.length; i++) {
				let val = input_data[i];
				if (val > 0) {
					if (val < valid_min) valid_min = val;
					if (val > valid_max) valid_max = val;
				}
			}
			
			Object.iterate(targets, (k, target_val) => {
				let tv = parseFloat(target_val);
				if (!isNaN(tv)) {
					if (tv < valid_min) valid_min = tv;
					if (tv > valid_max) valid_max = tv;
				}
			});
			
			if (valid_min === Infinity) valid_min = 0;
			if (valid_max === -Infinity) valid_max = 1;
			let valid_range = valid_max - valid_min;
			if (valid_range === 0) valid_range = 1;
			
			//Iterate through each region
			Object.iterate(mask_pixel_indices, (region_key, indices) => {
				let target = targets[region_key];
				if (target === undefined || isNaN(target) || indices.length === 0) return;
				
				let target_unit = (target - valid_min)/valid_range;
				target_unit = Math.max(0.0001, Math.min(0.9999, target_unit));
				
				let pixel_records = [];
				let total_weight = 0;
				let weighted_sum_unit = 0;
				
				for (let k = 0; k < indices.length; k++) {
					let idx = indices[k];
					let raw_val = input_data[idx];
					if (raw_val === 0) continue;
					
					let w = (weights) ? Math.max(0, weights[idx]) : 1;
					if (w <= 0) continue;
					
					let unit_val = (raw_val - valid_min)/valid_range;
					unit_val = Math.max(0.0001, Math.min(0.9999, unit_val));
					let logit_val = Math.log(unit_val/(1 - unit_val));
					
					pixel_records.push({ index: idx, logit_val: logit_val, weight: w });
					total_weight += w;
					weighted_sum_unit += (w*unit_val);
				}
				
				if (total_weight === 0 || pixel_records.length === 0) return;
				
				let current_unit = weighted_sum_unit/total_weight;
				current_unit = Math.max(0.0001, Math.min(0.9999, current_unit));
				
				let var_old = current_unit*(1 - current_unit);
				let var_target = target_unit*(1 - target_unit);
				let alpha = (var_target > 0) ? (var_old/var_target) : 1;
				alpha = Math.max(1.0, Math.min(10.0, alpha)); //Strict Non-Compression Rule
				
				//Binary search for optimal logit shift
				let best_shift = 0;
				let high = 20;
				let low = -20;
				
				for (let iter = 0; iter < max_iterations; iter++) {
					let mid = (low + high)/2;
					let w_sum = 0;
					
					for (let i = 0; i < pixel_records.length; i++) {
						let shifted_logit = (pixel_records[i].logit_val*alpha) + mid;
						let sigmoid = 1/(1 + Math.exp(-shifted_logit));
						w_sum += pixel_records[i].weight*sigmoid;
					}
					
					let mean_unit = w_sum/total_weight;
					if (mean_unit < target_unit) {
						low = mid;
					} else {
						high = mid;
					}
					best_shift = mid;
				}
				
				//Apply transformation back to output buffer
				for (let i = 0; i < pixel_records.length; i++) {
					let rec = pixel_records[i];
					let shifted_logit = (rec.logit_val*alpha) + best_shift;
					let new_unit = 1/(1 + Math.exp(-shifted_logit));
					output_data[rec.index] = valid_min + (new_unit*valid_range);
				}
			});
		} else {
			//Linear scalar scaling: target / current_sum
			Object.iterate(mask_pixel_indices, (region_key, indices) => {
				let target = targets[region_key];
				if (target === undefined || target <= 0 || indices.length === 0) return;
				
				let current_sum = 0;
				for (let k = 0; k < indices.length; k++)
					current_sum += input_data[indices[k]];
				
				if (current_sum > 0) {
					let scalar = target/current_sum;
					for (let k = 0; k < indices.length; k++) {
						let idx = indices[k];
						output_data[idx] = input_data[idx]*scalar;
					}
				}
			});
		}
		
		//Return statement
		return output_data;
	};
	
	/**
	 * Concurrently processes a timeseries of rasters with areal constraint clamping.
	 * @alias GeoPNG.processArealTimeseries
	 *
	 * @param {Object} arg0_options
	 *  @param {Object} arg0_options.areal_indexing - Pre-indexed geometry from GeoPNG.indexArealMasks.
	 *  @param {number} [arg0_options.concurrency=4]
	 *  @param {string} [arg0_options.mode="linear"]
	 *  @param {function} arg0_options.target_function - (year: number) => Object mapping region_key -> target.
	 *  @param {function} arg0_options.input_path_function - (year: number) => string.
	 *  @param {function} arg0_options.output_path_function - (year: number) => string.
	 *  @param {Array<number>} arg0_options.years - List of years to process.
	 *
	 * @returns {Promise<void>}
	 */
	GeoPNG.processArealTimeseries = async function (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Declare local instance variables
		let indexing = options.areal_indexing;
		let years = options.years || [];
		
		//Execute across years using the parallel framework
		await GeoPNG.processTimeseriesParallel({
			concurrency: options.concurrency,
			items: years,
			name: "Areal Timeseries Clamping",
			handler: async (year) => {
				let input_path = options.input_path_function(year);
				let output_path = options.output_path_function(year);
				
				if (!fs.existsSync(input_path)) return;
				
				let raster = await GeoPNG.loadNumberRasterImageAsync(input_path, { format: "float32" });
				let targets = options.target_function(year);
				let weights = (options.weights_function) ? options.weights_function(year) : undefined;
				
				let clamped_data = GeoPNG.applyArealClamping({
					data: raster.data,
					mask_areas: indexing.mask_areas,
					mask_pixel_indices: indexing.mask_pixel_indices,
					mode: options.mode,
					targets: targets,
					weights: weights
				});
				
				await GeoPNG.saveNumberRasterImageAsync({
					data: clamped_data,
					file_path: output_path,
					format: "float32",
					height: indexing.height,
					width: indexing.width
				});
			}
		});
	};
}
