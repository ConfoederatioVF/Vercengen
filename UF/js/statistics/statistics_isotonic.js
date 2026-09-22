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

	/**
	 * Smooths age cohorts and couples sex ratios simultaneously. Enforces non-increasing
	 * monotonicity along the age dimension using weighted PAVA on total cohort population,
	 * then allocates totals between male and female using a biologically monotonic sex-ratio envelope.
	 *
	 * @alias Statistics.coupleAgeSexCohorts
	 *
	 * @param {Float32Array|Array<number>} arg0_male_rates - Raw male cohort values.
	 * @param {Float32Array|Array<number>} arg1_female_rates - Raw female cohort values.
	 * @param {Float32Array|Array<number>} arg2_band_widths - Cohort duration in years (e.g. 1 for 00, 4 for 01, 5 for others).
	 * @param {number} [arg3_start_index=0] - Index from which to enforce age monotonicity (defaults to 0 on annualised density).
	 * @param {Object} [arg4_options]
	 *  @param {Float32Array|Array<number>} [arg4_options.baseline_sex_ratios] - Optional target sex-ratio curve M/F by cohort.
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
		let do_not_smooth = (options.do_not_smooth !== undefined) ? options.do_not_smooth : (options.lift_isotonic || options.pava === false || start_index < 0 || arg3_start_index === null);
		let preserve_sex_ratios = (options.preserve_sex_ratios !== undefined) ? options.preserve_sex_ratios : (options.enforce_biological_sex_ratios === false);

		//Declare local instance variables
		let baseline_ratios = options.baseline_sex_ratios || Statistics.default_biological_sex_ratios;
		let count = male_rates.length;
		let effective_weights = options.effective_weights || new Float32Array(count);
		let female_out = options.female_output || new Float32Array(count);
		let male_out = options.male_output || new Float32Array(count);
		let total_annualised = new Float32Array(count);
		let total_out = options.total_output || new Float32Array(count);
		let total_raw = new Float32Array(count);

		//Guard clauses
		if (count === 0)
			return { female: female_out, male: male_out, total: total_out };

		//Function body
		//1. Compute total cohort population and effective weights W_c = w_c * (1 + SR_c)
		for (let i = 0; i < count; i++) {
			let m_val = (male_rates[i] > 0) ? male_rates[i] : 0;
			let f_val = (female_rates[i] > 0) ? female_rates[i] : 0;
			let w = (band_widths && band_widths[i] > 0) ? band_widths[i] : 1;
			let sr = (baseline_ratios && baseline_ratios[i] !== undefined) ?
				baseline_ratios[i] :
				(Statistics.default_biological_sex_ratios[i] || 1.0);
			let q = 1 + sr;
			let effective_w = w*q;

			let tot = m_val + f_val;
			total_raw[i] = tot;
			total_annualised[i] = tot/effective_w;
			effective_weights[i] = effective_w;
		}

		//2. Run weighted PAVA on implied female density with effective weights W_c unless smoothing is lifted
		if (!do_not_smooth) {
			let pava_options = (options.buffers) ? { buffers: options.buffers } : {};
			let smoothed_female_density = Statistics.pavaDecreasing(total_annualised, effective_weights, Math.max(0, start_index), pava_options);

			//3. Reconstitute female, male, and total cohorts
			for (let i = 0; i < count; i++) {
				let w = (band_widths && band_widths[i] > 0) ? band_widths[i] : 1;
				let sr = (baseline_ratios && baseline_ratios[i] !== undefined) ?
					baseline_ratios[i] :
					(Statistics.default_biological_sex_ratios[i] || 1.0);

				let f_sm = smoothed_female_density[i]*w;
				let m_sm = f_sm*sr;

				female_out[i] = f_sm;
				male_out[i] = m_sm;
				total_out[i] = f_sm + m_sm;
			}
		} else {
			//Isotonic constraints lifted: preserve demographic shape, bulges, and dividends
			for (let i = 0; i < count; i++) {
				let m_val = (male_rates[i] > 0) ? male_rates[i] : 0;
				let f_val = (female_rates[i] > 0) ? female_rates[i] : 0;
				let tot = m_val + f_val;

				if (preserve_sex_ratios) {
					female_out[i] = f_val;
					male_out[i] = m_val;
					total_out[i] = tot;
				} else {
					let sr = (baseline_ratios && baseline_ratios[i] !== undefined) ?
						baseline_ratios[i] :
						(Statistics.default_biological_sex_ratios[i] || 1.0);
					let f_alloc = tot/(1 + sr);
					let m_alloc = f_alloc*sr;

					female_out[i] = f_alloc;
					male_out[i] = m_alloc;
					total_out[i] = tot;
				}
			}
		}

		//Return statement
		return { female: female_out, male: male_out, total: total_out };
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
		let total_length = values.length;
		let output = options.output || new Float32Array(total_length);
		
		//Copy unconstrained initial elements (e.g. infant and child mortality)
		for (let i = 0; i < start_index; i++)
			output[i] = values[i];
		
		let active_length = total_length - start_index;
		if (active_length <= 0) return output;
		
		let buffers = options.buffers;
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
