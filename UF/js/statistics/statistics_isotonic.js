//Initialise functions
{
	if (!global.Statistics)
		/**
		 * The namespace for all UF/Statistics utility functions, typically for static methods.
		 *
		 * @namespace Statistics
		 */
		global.Statistics = {};
	
	Statistics.default_biological_sex_ratios = new Float32Array([
		1.045, 1.042, 1.040, 1.038, 1.030, 1.015,
		0.985, 0.975, 0.965, 0.960, 0.950, 0.930,
		0.900, 0.860, 0.810, 0.750, 0.680, 0.600
	]);

	Statistics.default_sex_ratio_bounds = [
		[1.02, 1.07], // 00 (0-1) - Human biology tightly constrains sex ratio at birth
		[1.01, 1.07], // 01 (1-4)
		[0.95, 1.10], // 05 (5-9)
		[0.95, 1.10], // 10 (10-14)
		[0.50, 1.80], // 15 (15-19) - Working ages allow war shocks & sex-selective migration
		[0.50, 1.80], // 20 (20-24)
		[0.50, 1.80], // 25 (25-29)
		[0.50, 1.80], // 30 (30-34)
		[0.50, 1.80], // 35 (35-39)
		[0.50, 1.80], // 40 (40-44)
		[0.50, 1.80], // 45 (45-49)
		[0.50, 1.80], // 50 (50-54)
		[0.50, 1.80], // 55 (55-59)
		[0.50, 1.80], // 60 (60-64)
		[0.30, 1.05], // 65 (65-69) - Elderly cohorts reflect female survival advantage
		[0.30, 1.05], // 70 (70-74)
		[0.30, 1.05], // 75 (75-79)
		[0.30, 1.05]  // 80 (80+)
	];

	/**
	 * Smooths age cohorts and couples sex ratios simultaneously. Enforces non-increasing
	 * monotonicity along the age dimension using weighted PAVA on total cohort population density,
	 * then allocates totals between male and female using the model's empirical sex ratio bounded
	 * within a biological plausibility envelope (Option 1).
	 *
	 * @alias Statistics.coupleAgeSexCohorts
	 *
	 * @param {Float32Array|Array<number>} arg0_male_rates - Raw male cohort values.
	 * @param {Float32Array|Array<number>} arg1_female_rates - Raw female cohort values.
	 * @param {Float32Array|Array<number>} arg2_band_widths - Cohort duration in years (e.g. 1 for 00, 4 for 01, 5 for others).
	 * @param {number} [arg3_start_index=0] - Index from which to enforce age monotonicity (defaults to 0 on annualised density).
	 * @param {Object} [arg4_options]
	 *  @param {Float32Array|Array<number>} [arg4_options.baseline_sex_ratios] - Optional target sex-ratio curve M/F by cohort.
	 *  @param {Array<Array<number>>} [arg4_options.sex_ratio_bounds] - Optional min/max sex-ratio bounds by cohort.
	 *  @param {boolean} [arg4_options.enforce_fixed_sex_ratios=false] - If true, strictly forces M/F = baseline_sex_ratios.
	 *  @param {Object} [arg4_options.buffers] - Optional pre-allocated flat buffers for zero GC overhead.
	 *  @param {Float32Array} [arg4_options.female_output] - Optional target female output buffer.
	 *  @param {Float32Array} [arg4_options.male_output] - Optional target male output buffer.
	 *  @param {Float32Array} [arg4_options.total_output] - Optional target total output buffer.
	 *
	 * @returns {{ female: Float32Array, male: Float32Array, total: Float32Array }} Coupled smoothed cohort arrays.
	 */
	Statistics.coupleAgeSexCohorts = function (arg0_male_rates, arg1_female_rates, arg2_band_widths, arg3_start_index, arg4_options) {
		//Convert from parameters
		let male_rates = arg0_male_rates;
		let female_rates = arg1_female_rates;
		let band_widths = arg2_band_widths;
		let start_index = (arg3_start_index !== undefined && arg3_start_index !== null) ? parseInt(arg3_start_index) : 0;
		let options = (arg4_options) ? arg4_options : {};

		//Initialise options
		let bounds = options.sex_ratio_bounds || Statistics.default_sex_ratio_bounds;
		let do_not_smooth = (options.do_not_smooth !== undefined) ? options.do_not_smooth : (options.lift_isotonic || options.pava === false || start_index < 0 || arg3_start_index === null);
		let enforce_biological = (options.enforce_biological_sex_ratios !== false);
		let enforce_fixed = (options.enforce_fixed_sex_ratios === true);
		let preserve_sex_ratios = (options.preserve_sex_ratios === true);

		//Declare local instance variables
		let baseline_ratios = options.baseline_sex_ratios || Statistics.default_biological_sex_ratios;
		let buffers = options.buffers;
		let count = male_rates.length;
		let effective_weights = (buffers && buffers.effective_weights) ? buffers.effective_weights : (options.effective_weights || new Float32Array(count));
		let female_out = options.female_output || new Float32Array(count);
		let male_out = options.male_output || new Float32Array(count);
		let total_annualised = (buffers && buffers.total_annualised) ? buffers.total_annualised : new Float32Array(count);
		let total_out = options.total_output || new Float32Array(count);

		//Guard clauses
		if (count === 0)
			return { female: female_out, male: male_out, total: total_out };

		//Function body
		//1. Compute total cohort population and effective weights (band widths)
		for (let i = 0; i < count; i++) {
			let m_val = (male_rates[i] > 0) ? male_rates[i] : 0;
			let f_val = (female_rates[i] > 0) ? female_rates[i] : 0;
			let w = (band_widths && band_widths[i] > 0) ? band_widths[i] : 1;

			let tot = m_val + f_val;
			total_annualised[i] = tot / w;
			effective_weights[i] = w;
		}

		//2. Run weighted PAVA on total population density to guarantee age monotonicity (if smoothing enabled)
		let smoothed_density = total_annualised;
		if (!do_not_smooth) {
			let pava_options = (options.buffers) ? { buffers: options.buffers } : {};
			smoothed_density = Statistics.pavaDecreasing(total_annualised, effective_weights, Math.max(0, start_index), pava_options);
		}

		//3. Reconstitute female, male, and total cohorts using male-share formulation
		for (let i = 0; i < count; i++) {
			let w = (band_widths && band_widths[i] > 0) ? band_widths[i] : 1;
			let tot_sm = smoothed_density[i]*w;

			let p_m;
			if (enforce_fixed) {
				let r_prior = (baseline_ratios && baseline_ratios[i] !== undefined) ?
					baseline_ratios[i] :
					(Statistics.default_biological_sex_ratios[i] || 1.045);
				p_m = r_prior / (1.0 + r_prior);
			} else {
				let m_raw = (male_rates[i] > 0) ? male_rates[i] : 0;
				let f_raw = (female_rates[i] > 0) ? female_rates[i] : 0;
				let tot_raw = m_raw + f_raw;

				if (tot_raw > 1e-9) {
					p_m = m_raw / tot_raw;
				} else {
					let r_prior = (baseline_ratios && baseline_ratios[i] !== undefined) ?
						baseline_ratios[i] :
						(Statistics.default_biological_sex_ratios[i] || 1.045);
					p_m = r_prior / (1.0 + r_prior);
				}

				if (enforce_biological && !preserve_sex_ratios) {
					let cohort_bounds = (bounds && bounds[i]) ? bounds[i] : [0.40, 1.80];
					let p_min = cohort_bounds[0] / (1.0 + cohort_bounds[0]);
					let p_max = cohort_bounds[1] / (1.0 + cohort_bounds[1]);
					p_m = Math.max(p_min, Math.min(p_max, p_m));
				}
			}

			let m_sm = tot_sm*p_m;
			let f_sm = tot_sm*(1.0 - p_m);

			female_out[i] = f_sm;
			male_out[i] = m_sm;
			total_out[i] = tot_sm;
		}

		//Return statement
		return { female: female_out, male: male_out, total: total_out };
	};

	/**
	 * Computes a normalised logistic transition kernel weight w in [0, 1] over a domain [start_val, end_val].
	 * Returns 0 for values <= start_val, 1 for values >= end_val, and an S-curve blend for intermediate values.
	 *
	 * @alias Statistics.getLogisticKernelWeight
	 *
	 * @param {number} arg0_value
	 * @param {number} [arg1_start_val=1750]
	 * @param {number} [arg2_end_val=1850]
	 * @param {Object} [arg3_options]
	 *  @param {number} [arg3_options.steepness=8]
	 *
	 * @returns {number}
	 */
	Statistics.getLogisticKernelWeight = function (arg0_value, arg1_start_val, arg2_end_val, arg3_options) {
		//Convert from parameters
		let value = arg0_value;
		let start_val = (arg1_start_val !== undefined && arg1_start_val !== null) ? arg1_start_val : 1750;
		let end_val = (arg2_end_val !== undefined && arg2_end_val !== null) ? arg2_end_val : 1850;
		let options = (arg3_options) ? arg3_options : {};

		//Initialise options
		let steepness = (options.steepness !== undefined) ? options.steepness : 8;

		//Guard clauses
		if (!Number.isFinite(value)) return 0;
		if (start_val >= end_val) return (value >= end_val) ? 1 : 0;
		if (value <= start_val) return 0;
		if (value >= end_val) return 1;

		//Declare local instance variables
		let f_0 = 1 / (1 + Math.exp(steepness * 0.5));
		let f_1 = 1 / (1 + Math.exp(-steepness * 0.5));
		let f_x = 0;
		let normalised_weight = 0;
		let x = (value - start_val) / (end_val - start_val);

		//Function body
		f_x = 1 / (1 + Math.exp(-steepness * (x - 0.5)));
		normalised_weight = (f_x - f_0) / (f_1 - f_0);
		normalised_weight = Math.max(0, Math.min(1, normalised_weight));

		//Return statement
		return normalised_weight;
	};

	/**
	 * Enforces non-increasing monotonicity on a sequence using the weighted Pool Adjacent Violators
	 * Algorithm (PAVA). Values before arg2_start_index are preserved unconstrained.
	 *
	 * @alias Statistics.pavaDecreasing
	 *
	 * @param {Float32Array|Array<number>} arg0_values - Array of values to smooth.
	 * @param {Float32Array|Array<number>} [arg1_weights] - Optional weights (e.g. cohort band widths).
	 * @param {number} [arg2_start_index=0] - Index from which to enforce non-increasing monotonicity.
	 * @param {Object} [arg3_options]
	 *  @param {Object} [arg3_options.buffers] - Optional pre-allocated flat buffers for zero GC overhead.
	 *   @param {Float32Array} [arg3_options.buffers.block_vals]
	 *   @param {Float32Array} [arg3_options.buffers.block_weights]
	 *   @param {Int32Array} [arg3_options.buffers.block_counts]
	 *  @param {Float32Array|Array<number>} [arg3_options.output] - Optional target output buffer.
	 *
	 * @returns {Float32Array|Array<number>} Monotonically decreasing output array.
	 */
	Statistics.pavaDecreasing = function (arg0_values, arg1_weights, arg2_start_index, arg3_options) {
		//Convert from parameters
		let values = arg0_values;
		let weights = arg1_weights;
		let start_index = (arg2_start_index !== undefined) ? Math.max(0, parseInt(arg2_start_index)) : 0;
		let options = (arg3_options) ? arg3_options : {};
		
		//Declare local instance variables
		let buffers = options.buffers;
		let total_length = values.length;
		let output = (buffers && buffers.output) ? buffers.output : (options.output || new Float32Array(total_length));
		
		//Copy unconstrained initial elements (e.g. infant and child mortality)
		for (let i = 0; i < start_index; i++)
			output[i] = values[i];
		
		let active_length = total_length - start_index;
		if (active_length <= 0) return output;
		
		let block_counts = (buffers && buffers.block_counts) ? buffers.block_counts : new Int32Array(active_length);
		let block_vals = (buffers && buffers.block_vals) ? buffers.block_vals : new Float32Array(active_length);
		let block_weights = (buffers && buffers.block_weights) ? buffers.block_weights : new Float32Array(active_length);
		
		//Initialise block states
		for (let i = 0; i < active_length; i++) {
			let src_idx = start_index + i;
			block_counts[i] = 1;
			block_vals[i] = values[src_idx];
			block_weights[i] = (weights && weights[src_idx] !== undefined) ? weights[src_idx] : 1;
		}
		
		//PAVA pooling loop
		let b = 0;
		let num_blocks = active_length;
		
		while (b < num_blocks - 1) {
			//Violation of non-increasing order: previous block is smaller than next block
			if (block_vals[b] < block_vals[b + 1]) {
				let w_sum = block_weights[b] + block_weights[b + 1];
				block_vals[b] = ((block_vals[b]*block_weights[b]) + (block_vals[b + 1]*block_weights[b + 1]))/w_sum;
				block_weights[b] = w_sum;
				block_counts[b] += block_counts[b + 1];
				
				//Shift subsequent blocks left
				for (let k = b + 1; k < num_blocks - 1; k++) {
					block_counts[k] = block_counts[k + 1];
					block_vals[k] = block_vals[k + 1];
					block_weights[k] = block_weights[k + 1];
				}
				num_blocks--;
				
				//Step back to check against previous block
				if (b > 0) b--;
			} else {
				b++;
			}
		}
		
		//Unpack blocks into output
		let write_idx = start_index;
		for (let k = 0; k < num_blocks; k++) {
			let count = block_counts[k];
			let val = block_vals[k];
			
			for (let j = 0; j < count; j++)
				output[write_idx++] = val;
		}
		
		//Return statement
		return output;
	};
}

