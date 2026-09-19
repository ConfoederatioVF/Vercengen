//Initialise functions
{
	//[QUARANTINE] - Many of these methods should be further generalised between OLS/Logit
	if (!global.Statistics)
		/**
		 * The namespace for all UF/Statistics utility functions, typically for static methods.
		 *
		 * @namespace Statistics
		 */
		global.Statistics = {};
	
	/**
	 * Returns the class label at a given index of Y, unwrapping single-element arrays.
	 * @alias Statistics.getClassLabel
	 *
	 * @param {Array} arg0_Y
	 * @param {number} arg1_index
	 *
	 * @returns {any}
	 */
	Statistics.getClassLabel = function (arg0_Y, arg1_index) {
		//Declare local instance variables
		let local_value = arg0_Y[arg1_index];
		
		//Return statement
		return (Array.isArray(local_value)) ? local_value[0] : local_value;
	};
	
	/**
	 * Loads a set of covariate rasters, resolving function- or string-valued paths and
	 * dropping rasters that fail to load. Shared by all covariate-stacking routines.
	 * @alias Statistics.loadCovariateRasters
	 *
	 * @param {Object} arg0_covariates_obj
	 * @param {Object} [arg1_options]
	 *  @param {boolean} [arg1_options.data_only=false] - Store .data arrays instead of rasters.
	 *  @param {Array} [arg1_options.formatting_parameters=[]] - Spread into function-valued covariates.
	 *  @param {number} [arg1_options.year] - If set, function-valued covariates receive this single argument instead.
	 *
	 * @returns {Object} - { rasters_obj, valid_keys }
	 */
	Statistics.loadCovariateRasters = function (arg0_covariates_obj, arg1_options) {
		//Convert from parameters
		let covariates_obj = arg0_covariates_obj;
		let options = (arg1_options) ? arg1_options : {};
		
		//Initialise options
		if (!options.formatting_parameters) options.formatting_parameters = [];
		
		//Declare local instance variables
		let rasters_obj = {};
		let valid_keys = [];
		
		//Iterate over covariates_obj; resolve paths and load each raster
		Object.iterate(covariates_obj, (local_key, local_value) => {
			let local_file_path;
			
			if (typeof local_value === "function") {
				local_file_path = (options.year !== undefined) ?
					local_value(options.year) : local_value(...options.formatting_parameters);
			} else {
				local_file_path = local_value;
			}
			
			let local_format = "int32";
			
			//Destructure if array is returned
			if (Array.isArray(local_file_path)) {
				local_format = local_file_path[1];
				local_file_path = local_file_path[0];
			}
			
			//Attempt to load the covariate raster; drop it on failure
			try {
				if (!fs.existsSync(local_file_path))
					throw new Error(`File not found: ${local_file_path}`);
				
				let local_raster = GeoPNG.loadNumberRasterImage(local_file_path, {
					format: local_format
				});
				
				rasters_obj[local_key] = (options.data_only) ? local_raster.data : local_raster;
				valid_keys.push(local_key);
			} catch (e) {
				console.log(`- Missing covariate raster for ${local_key} at ${local_file_path}. Dropping coefficient for this run.`);
			}
		});
		
		//Return statement
		return { rasters_obj: rasters_obj, valid_keys: valid_keys };
	};
}