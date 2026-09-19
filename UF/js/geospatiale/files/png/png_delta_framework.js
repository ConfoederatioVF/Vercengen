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
	 * Generates a delta series for a specific timeseries, used for later covariates.
	 * @alias GeoPNG.generateDeltaSeries
	 * 
	 * @param {string} arg0_output_folder_path
	 * @param {Object} [arg1_options]
	 *  @param {string} [arg1_options.input_format="int32"]
	 *  @param {function} [arg1_options.input_format_function] - (arg0_year:{@link number}). Returns {@link string} representing the file path for the given year.
	 *  @param {number[]} [arg1_options.years]
	 *
	 * @returns {Promise<void>}
	 */
	GeoPNG.generateDeltaSeries = async function (arg0_output_folder_path, arg1_options) {
		//Declare local instance variables
		let output_folder_path = arg0_output_folder_path;
		let options = (arg1_options) ? arg1_options : {};
		
		//Initialise options
		if (!options.input_format) options.input_format = "int32";
		if (!options.prefix) options.prefix = "delta_";
		if (!options.years) options.years = [];
		
		//Iterate over years to calculate yearly rate of change between steps
		for (let i = 1; i < options.years.length; i++) {
			let current_year = options.years[i];
			let previous_year = options.years[i - 1];
			let year_diff = current_year - previous_year;
			
			let current_file_path = options.input_format_function(current_year);
			let previous_file_path = options.input_format_function(previous_year);
			
			console.log(`- Generating delta raster for ${current_year} (Interval: ${year_diff} year(s)) ..`);
			
			//Load current and previous rasters
			let current_raster = GeoPNG.loadNumberRasterImage(current_file_path, {
				format: options.input_format
			});
			let previous_raster = GeoPNG.loadNumberRasterImage(previous_file_path, {
				format: options.input_format
			});
			
			let output_file_path = `${output_folder_path}/${options.prefix}${current_year}.png`;
			
			//Save the delta raster; the function calculates the slope (rate of change)
			GeoPNG.saveNumberRasterImage({
				file_path: output_file_path,
				format: "float32",
				width: current_raster.width,
				height: current_raster.height,
				function: (local_index) => {
					let current_val = current_raster.data[local_index];
					let previous_val = previous_raster.data[local_index];
					
					//Return yearly rate of change: (V2 - V1) / (T2 - T1)
					return (current_val - previous_val)/year_diff;
				}
			});
			
			console.log(`- Saved delta raster to ${output_file_path}.`);
			await Blacktraffic.yield();
		}
	};
	
	/**
	 * Shatters a temporal series of rasters into a combined unique areal mask raster and records its historical lineage.
	 * @alias GeoPNG.shatter
	 *
	 * @param {string} arg0_input_prefix - The path prefix of the input PNG files (e.g. "path/to/gini_").
	 * @param {string} arg1_output_prefix - The path prefix for output files (saves to `${prefix}_masks.png` and `${prefix}_metadata.json`).
	 * @param {Object} [arg2_options] - Configuration options.
	 *  @param {number[]} [arg2_options.years=[]] - The temporal sequence of years to evaluate.
	 *
	 * @returns {Promise<Object|undefined>} Traced lineage mapping RGBA pixel representations to chronological value paths.
	 */
	GeoPNG.shatter = async function (arg0_input_prefix, arg1_output_prefix, arg2_options) {
		//Declare local instance variables
		let height = 0;
		let mask_data;
		let next_region_id = 1;
		let options = (arg2_options) ? arg2_options : {};
		let width = 0;
		let years = options.years || [];
		
		//region_history tracking: maps unique_id -> { parent: id, year: number, value: number }
		let region_history = new Map();
		
		//Iterate chronologically to split existing regions based on value changes over time
		for (let i = 0; i < years.length; i++) {
			let local_path = `${arg0_input_prefix}${years[i]}.png`;
			
			if (fs.existsSync(local_path)) {
				let local_raster = GeoPNG.loadNumberRasterImage(local_path, {
					format: "float32"
				});
				
				//Initialise mask_data dimensions using the first available valid raster
				if (!mask_data) {
					mask_data = new Int32Array(local_raster.data.length);
					height = local_raster.height;
					width = local_raster.width;
				}
				
				let transition_map = new Map();
				
				//Analyze pixel-by-pixel transitions to register unique paths
				for (let x = 0; x < local_raster.data.length; x++) {
					let current_pixel_id = mask_data[x];
					let current_value = local_raster.data[x];
					
					//Regions are unique if their parent ID combined with current value is unique
					let transition_key = `${current_pixel_id}|${current_value}`;
					
					if (!transition_map.has(transition_key)) {
						let new_id = next_region_id++;
						transition_map.set(transition_key, new_id);
						
						region_history.set(new_id, {
							parent: current_pixel_id,
							year: years[i],
							value: current_value
						});
					}
					mask_data[x] = transition_map.get(transition_key);
				}
				console.log(`- Processed ${years[i]}. Current unique region count: ${next_region_id - 1}`);
				await Blacktraffic.yield();
			}
		}
		
		if (mask_data) {
			//1. Track IDs that actually exist in the final spatial partition
			let final_ids = new Set();
			
			for (let i = 0; i < mask_data.length; i++) {
				final_ids.add(mask_data[i]);
			}
			
			//2. Reconstruct spatial-temporal history by traversing back up the lineage path
			let final_metadata = {};
			
			for (let local_id of final_ids) {
				let local_history = {};
				let local_pointer = local_id;
				
				while (local_pointer > 0) {
					let history_entry = region_history.get(local_pointer);
					
					if (history_entry) {
						local_history[history_entry.year] = history_entry.value;
						local_pointer = history_entry.parent;
					} else {
						local_pointer = 0;
					}
				}
				
				//Convert numerical ID to standard RGBA string representation for map rendering compatibility
				final_metadata[Colour.encodeNumberAsRGBA(Number(local_id)).join(",")] = local_history;
			}
			
			//3. Save the reconstructed areal mask PNG file
			GeoPNG.saveNumberRasterImage({
				file_path: `${arg1_output_prefix}_masks.png`,
				format: "int32",
				width,
				height,
				function: function (local_index) {
					//Return statement
					return mask_data[local_index];
				}
			});
			
			//4. Write output metadata to JSON
			fs.writeFileSync(`${arg1_output_prefix}_metadata.json`, JSON.stringify(final_metadata));
			console.log(`- Finished generating areal masks. Final unique regions: ${final_ids.size}.`);
			
			//Return statement
			return final_metadata;
		}
	};
}