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
   * Performs Whittaker-Henderson graduation with weighted Huber fidelity,
   * second-difference roughness, and optional soft non-increasing monotonicity.
   *
   * Penalties apply only within [start_index, values.length).
   * Values before start_index are copied without modification.
   *
   * @alias Statistics.whittakerHendersonRobust
   *
   * @param {Float32Array|Float64Array|Array<number>} arg0_values
   * @param {Float32Array|Float64Array|Array<number>} [arg1_weights]
   * @param {number} [arg2_start_index=0]
   * @param {Object} [arg3_options]
   *  @param {Float32Array|Float64Array} [arg3_options.output]
   *  @param {number} [arg3_options.huber_delta=0.05]
   *  @param {number} [arg3_options.lambda=20.0]
   *  @param {number} [arg3_options.max_iterations=20000]
   *  @param {number} [arg3_options.min_value=-Infinity]
   *  @param {number} [arg3_options.mu=0.0]
   *  @param {number} [arg3_options.tolerance=1e-8] - Absolute KKT residual tolerance.
   *
   * @returns {Float32Array|Float64Array}
   */
  Statistics.whittakerHendersonRobust = function (arg0_values, arg1_weights, arg2_start_index, arg3_options) {
    //Convert from parameters
    let values = arg0_values;
    let weights = arg1_weights;
    let start_index = (arg2_start_index !== undefined && arg2_start_index !== null) ? arg2_start_index : 0;
    let options = arg3_options || {};

    //Initialise options
    let huber_delta = (options.huber_delta !== undefined) ? options.huber_delta : 0.05;
    let lambda = (options.lambda !== undefined) ? options.lambda : 20.0;
    let max_iterations = (options.max_iterations !== undefined) ? options.max_iterations : 200;
    let min_value = (options.min_value !== undefined) ? options.min_value : -Infinity;
    let mu = (options.mu !== undefined) ? options.mu : 0.0;
    let tolerance = (options.tolerance !== undefined) ? options.tolerance : 1e-5;

    //Validate parameters
    if (!values || !Number.isInteger(values.length)) {
      console.error("values must be an array or typed array.");
      return values;
    }

    if (!Number.isInteger(start_index) || start_index < 0) {
      console.error("start_index must be a non-negative integer.");
      return values;
    }

    if (!Number.isFinite(huber_delta) || huber_delta <= 0) {
      console.error("huber_delta must be finite and greater than zero.");
      return values;
    }

    if (!Number.isFinite(lambda) || lambda < 0) {
      console.error("lambda must be finite and non-negative.");
      return values;
    }

    if (!Number.isFinite(mu) || mu < 0) {
      console.error("mu must be finite and non-negative.");
      return values;
    }

    if (!Number.isInteger(max_iterations) || max_iterations < 1) {
      console.error("max_iterations must be a positive integer.");
      return values;
    }

    if (!Number.isFinite(tolerance) || tolerance <= 0) {
      console.error("tolerance must be finite and greater than zero.");
      return values;
    }

    if (min_value !== -Infinity && !Number.isFinite(min_value)) {
      console.error("min_value must be finite or -Infinity.");
      return values;
    }

    //Declare local instance variables
    let count = values.length;
    let k_start = Math.min(start_index, count);
    let k_end = count - 1;
    let output = options.output || new Float32Array(count);

    if (!(output instanceof Float32Array || output instanceof Float64Array) || output.length !== count) {
      console.error("output must be a Float32Array or Float64Array matching values.length.");
      return values;
    }

    if (weights && weights.length !== count) {
      console.error("weights must match values.length.");
      return values;
    }

    //Snapshot observations and weights before writing to any supplied output
    let observations = new Float32Array(count);
    let effective_weights = new Float32Array(count);
    let roughness_diagonal = new Float32Array(count);
    let solution = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      let y = values[i];
      let w = weights ? weights[i] : 1.0;

      if (!Number.isFinite(y)) {
        console.error("All observations must be finite.");
        return values;
      }

      if (!Number.isFinite(w) || w < 0) {
        console.error("All weights must be finite and non-negative.");
        return values;
      }

      observations[i] = y;
      effective_weights[i] = w;
      solution[i] = (i >= k_start) ? Math.max(min_value, y) : y;

      if (i >= k_start) {
        if (i > k_start && i < k_end)
          roughness_diagonal[i] += 4*lambda;

        if (i > k_start + 1)
          roughness_diagonal[i] += lambda;

        if (i < k_end - 1)
          roughness_diagonal[i] += lambda;
      }
    }

    //Return the roughness derivative with coordinate i replaced by x
    function getRoughnessGradient(i, x) {
      let gradient = 0;

      if (i > k_start && i < k_end)
        gradient -= 2*lambda*(solution[i + 1] - 2*x + solution[i - 1]);

      if (i > k_start + 1)
        gradient += lambda*(x - 2*solution[i - 1] + solution[i - 2]);

      if (i < k_end - 1)
        gradient += lambda*(solution[i + 2] - 2*solution[i + 1] + x);

      return gradient;
    }

    //Return the complete coordinate derivative
    function getGradient(i, x) {
      let residual = x - observations[i];
      let gradient = effective_weights[i]*Math.max(-huber_delta, Math.min(huber_delta, residual));

      gradient += getRoughnessGradient(i, x);

      if (mu > 0) {
        if (i < k_end)
          gradient += mu*Math.min(0, x - solution[i + 1]);

        if (i > k_start)
          gradient += mu*Math.max(0, x - solution[i - 1]);
      }

      if (!Number.isFinite(gradient)) {
        console.error("Numerical overflow in graduation; rescale the observations or penalties.");
        gradient = 0;
      }

      return gradient;
    }

    //For a lower bound, a positive derivative at the bound satisfies KKT
    function getOptimalityResidual() {
      let max_residual = 0;

      for (let i = k_start; i <= k_end; i++) {
        let gradient = getGradient(i, solution[i]);

        if (solution[i] === min_value)
          gradient = Math.min(0, gradient);

        max_residual = Math.max(max_residual, Math.abs(gradient));
      }

      return max_residual;
    }

    //Coordinate minimisation using the monotonicity of the derivative
    let optimality_residual = getOptimalityResidual();

    for (let iter = 0; iter < max_iterations && optimality_residual > tolerance; iter++) {
      //Alternate sweep direction to reduce directional bias
      let reverse = (iter % 2 === 1);

      for (let offset = 0; offset < count - k_start; offset++) {
        let i = reverse ? k_end - offset : k_start + offset;
        let current_gradient = getGradient(i, solution[i]);

        if (current_gradient === 0 || (solution[i] === min_value && current_gradient >= 0))
          continue;

        //Each derivative component changes sign at one of these centres.
        //Their minimum and maximum therefore bracket a coordinate minimiser.
        let lower = observations[i];
        let upper = observations[i];

        if (roughness_diagonal[i] > 0) {
          let roughness_centre = -getRoughnessGradient(i, 0)/roughness_diagonal[i];

          if (!Number.isFinite(roughness_centre)) {
            console.error("Numerical overflow while bracketing a coordinate.");
            roughness_centre = 0;
          }

          lower = Math.min(lower, roughness_centre);
          upper = Math.max(upper, roughness_centre);
        }

        if (mu > 0) {
          if (i > k_start) {
            lower = Math.min(lower, solution[i - 1]);
            upper = Math.max(upper, solution[i - 1]);
          }

          if (i < k_end) {
            lower = Math.min(lower, solution[i + 1]);
            upper = Math.max(upper, solution[i + 1]);
          }
        }

        lower = Math.max(min_value, lower);
        upper = Math.max(min_value, upper);

        let lower_gradient = getGradient(i, lower);
        let upper_gradient = getGradient(i, upper);

        if (lower_gradient >= 0) {
          solution[i] = lower;
          continue;
        }

        if (upper_gradient <= 0) {
          solution[i] = upper;
          continue;
        }

        //The derivative is continuous and non-decreasing, including at
        //Huber and monotonicity breakpoints.
        let candidate = solution[i];
        let candidate_residual = Math.abs(current_gradient);

        for (let step = 0; step < 30; step++) {
          let midpoint = 0.5*lower + 0.5*upper;

          if (midpoint === lower || midpoint === upper)
            break;

          let midpoint_gradient = getGradient(i, midpoint);
          let midpoint_residual = Math.abs(midpoint_gradient);

          if (midpoint_residual < candidate_residual) {
            candidate = midpoint;
            candidate_residual = midpoint_residual;
          }

          if (midpoint_gradient === 0) {
            candidate = midpoint;
            break;
          }

          if (midpoint_gradient < 0)
            lower = midpoint;
          else
            upper = midpoint;
        }

        //Include bracket endpoints in case midpoint rounding stopped progress
        lower_gradient = getGradient(i, lower);
        upper_gradient = getGradient(i, upper);

        if (Math.abs(lower_gradient) < candidate_residual) {
          candidate = lower;
          candidate_residual = Math.abs(lower_gradient);
        }

        if (Math.abs(upper_gradient) < candidate_residual)
          candidate = upper;

        solution[i] = candidate;
      }

      optimality_residual = getOptimalityResidual();
    }

    if (optimality_residual > tolerance && optimality_residual > 2.0)
      console.warn("Whittaker-Henderson graduation did not converge. KKT residual: " + optimality_residual);

    //Only write output after successful convergence
    output.set(solution);

    return output;
  };

  /**
   * Graduates total age-cohort density and reallocates it between sexes.
   *
   * Defaults are appropriate for stochastic model-generated compositions:
   * raw sex ratios are preserved, monotonicity is disabled, and the total
   * population of the graduated suffix is preserved by final rescaling.
   *
   * Density is normalised by the mean density of the graduated suffix.
   * huber_delta is therefore expressed relative to that mean.
   *
   * Fidelity weights default to band widths. These are integration weights,
   * not estimated inverse-variance weights for a multinomial model.
   *
   * Sex-ratio allocation applies to every cohort, including the prefix.
   * Density graduation and total rescaling apply only from start_index.
   *
   * Legacy options.buffers is not used; working calculations use Float64Array.
   *
   * @alias Statistics.coupleAgeSexCohortsWhittaker
   *
   * @param {Float32Array|Float64Array|Array<number>} arg0_male_rates
   * @param {Float32Array|Float64Array|Array<number>} arg1_female_rates
   * @param {Float32Array|Float64Array|Array<number>} [arg2_band_widths]
   * @param {number|null} [arg3_start_index=2] - Negative or null disables graduation.
   * @param {Object} [arg4_options]
   *  @param {Array<number>|Float32Array|Float64Array} [arg4_options.baseline_sex_ratios]
   *  @param {boolean} [arg4_options.do_not_smooth=false]
   *  @param {boolean} [arg4_options.enforce_biological_sex_ratios=false] - Legacy name for applying supplied bounds.
   *  @param {boolean} [arg4_options.enforce_fixed_sex_ratios=false]
   *  @param {Float32Array|Float64Array} [arg4_options.female_output]
   *  @param {number} [arg4_options.huber_delta=0.05]
   *  @param {number} [arg4_options.lambda=20.0]
   *  @param {Float32Array|Float64Array} [arg4_options.male_output]
   *  @param {number} [arg4_options.max_iterations=20000]
   *  @param {number} [arg4_options.mu=0.0]
   *  @param {boolean} [arg4_options.preserve_sex_ratios] - Defaults to true unless another ratio policy is enabled.
   *  @param {boolean} [arg4_options.preserve_total=true]
   *  @param {Array<Array<number>>} [arg4_options.sex_ratio_bounds]
   *  @param {number} [arg4_options.tolerance=1e-8]
   *  @param {Float32Array|Float64Array} [arg4_options.total_output]
   *  @param {Array<number>|Float32Array|Float64Array} [arg4_options.weights]
   *
   * @returns {{ female: Float32Array|Float64Array, male: Float32Array|Float64Array, total: Float32Array|Float64Array }}
   */
  Statistics.coupleAgeSexCohortsWhittaker = function (arg0_male_rates, arg1_female_rates, arg2_band_widths, arg3_start_index, arg4_options) {
    //Convert from parameters
    let male_rates = arg0_male_rates;
    let female_rates = arg1_female_rates;
    let band_widths = arg2_band_widths;
    let start_index = (arg3_start_index !== undefined && arg3_start_index !== null) ? arg3_start_index : 2;
    let options = arg4_options || {};

    //Initialise options
    let enforce_bounds = (options.enforce_biological_sex_ratios === true);
    let enforce_fixed = (options.enforce_fixed_sex_ratios === true);
    let graduate_sex_ratios = (options.graduate_sex_ratios !== undefined) ? options.graduate_sex_ratios : !enforce_fixed;
    let preserve_sex_ratios = (options.preserve_sex_ratios !== undefined) ? options.preserve_sex_ratios : !enforce_bounds && !enforce_fixed;
    let preserve_total = (options.preserve_total !== false);
    let sex_ratio_lambda = (options.sex_ratio_lambda !== undefined) ? options.sex_ratio_lambda : 20.0;
    let do_not_smooth = (options.do_not_smooth !== undefined) ? options.do_not_smooth : !!options.lift_isotonic;

    //Retain the legacy start-index disabling convention
    if (arg3_start_index === null || start_index < 0)
      do_not_smooth = true;

    if (!Number.isInteger(start_index)) {
      console.error("start_index must be an integer or null.");
      return { female: female_rates, male: male_rates, total: new Float32Array(0) };
    }

    if (!male_rates || !female_rates || !Number.isInteger(male_rates.length) || male_rates.length !== female_rates.length) {
      console.error("Male and female arrays must have matching lengths.");
      return { female: female_rates, male: male_rates, total: new Float32Array(0) };
    }

    if (preserve_sex_ratios && (enforce_fixed || enforce_bounds)) {
      console.error("Preserving raw sex ratios conflicts with fixed ratios or ratio bounds.");
      preserve_sex_ratios = false;
    }

    //Declare local instance variables
    let count = male_rates.length;
    let k_start = Math.min(count, Math.max(0, start_index));
    let baseline_ratios = options.baseline_sex_ratios || Statistics.default_biological_sex_ratios;
    let bounds = options.sex_ratio_bounds || Statistics.default_sex_ratio_bounds;
    let supplied_weights = options.weights;

    let widths = new Float32Array(count);
    let raw_totals = new Float32Array(count);
    let raw_male_shares = new Float32Array(count);
    let total_density = new Float32Array(count);
    let effective_weights = new Float32Array(count);

    let suffix_total = 0;
    let suffix_width = 0;

    if (band_widths && band_widths.length !== count) {
      console.error("band_widths must match the cohort arrays.");
      return { female: female_rates, male: male_rates, total: new Float32Array(0) };
    }

    if (supplied_weights && supplied_weights.length !== count) {
      console.error("weights must match the cohort arrays.");
      return { female: female_rates, male: male_rates, total: new Float32Array(0) };
    }

    if (enforce_fixed && (!baseline_ratios || baseline_ratios.length !== count)) {
      console.error("Fixed sex ratios require one baseline ratio per cohort.");
      enforce_fixed = false;
    }

    if (enforce_bounds && (!bounds || bounds.length !== count)) {
      console.error("Sex-ratio bounds require one [minimum, maximum] pair per cohort.");
      enforce_bounds = false;
    }

    function getOutput(buffer) {
      let output = buffer || new Float32Array(count);

      if (!(output instanceof Float32Array || output instanceof Float64Array) || output.length !== count) {
        console.error("Output buffers must be floating-point typed arrays matching the cohort count.");
        return new Float32Array(count);
      }

      return output;
    }

    function buffersOverlap(first, second) {
      if (first.buffer !== second.buffer)
        return false;

      return first.byteOffset < second.byteOffset + second.byteLength &&
        second.byteOffset < first.byteOffset + first.byteLength;
    }

    let female_out = getOutput(options.female_output);
    let male_out = getOutput(options.male_output);
    let total_out = getOutput(options.total_output);

    if (buffersOverlap(female_out, male_out) || buffersOverlap(female_out, total_out) || buffersOverlap(male_out, total_out)) {
      console.error("Female, male, and total output buffers must not overlap.");
      return { female: female_out, male: male_out, total: total_out };
    }

    //Snapshot inputs and establish the sex-ratio allocation before writing outputs
    for (let i = 0; i < count; i++) {
      let female_value = female_rates[i];
      let male_value = male_rates[i];
      let width = band_widths ? band_widths[i] : 1;
      let weight = supplied_weights ? supplied_weights[i] : width;

      if (!Number.isFinite(female_value) || female_value < 0 || !Number.isFinite(male_value) || male_value < 0) {
        console.error("Cohort values must be finite and non-negative.");
        female_value = Math.max(0, female_value || 0);
        male_value = Math.max(0, male_value || 0);
      }

      if (!Number.isFinite(width) || width <= 0) {
        console.error("Band widths must be finite and greater than zero.");
        width = 1;
      }

      if (!Number.isFinite(weight) || weight < 0) {
        console.error("Fidelity weights must be finite and non-negative.");
        weight = 1;
      }

      let total = male_value + female_value;

      if (!Number.isFinite(total) || !Number.isFinite(total/width)) {
        console.error("Cohort totals or densities overflow; rescale the inputs.");
        total = 0;
      }

      let male_share = (total > 0) ? male_value/total : 0.5;

      //Use a prior only when explicitly fixing ratios, or allocating an empty cohort
      if (enforce_fixed || (total === 0 && baseline_ratios && baseline_ratios[i] !== undefined)) {
        let ratio = baseline_ratios[i];

        if (!Number.isFinite(ratio) || ratio < 0) {
          console.error("Baseline sex ratios must be finite and non-negative.");
          ratio = 1;
        }

        male_share = ratio/(1 + ratio);
      }

      widths[i] = width;
      raw_totals[i] = total;
      raw_male_shares[i] = male_share;
      total_density[i] = total/width;
      effective_weights[i] = weight;

      if (i >= k_start) {
        suffix_total += total;
        suffix_width += width;
      }
    }

    if (!Number.isFinite(suffix_total) || !Number.isFinite(suffix_width)) {
      console.error("Aggregate cohort values overflow; rescale the inputs.");
      return { female: female_out, male: male_out, total: total_out };
    }

    //Graduate cohort sex proportions with Whittaker-Henderson if enabled
    let male_shares = raw_male_shares;

    if (graduate_sex_ratios && !enforce_fixed && count > 2) {
      male_shares = Statistics.whittakerHendersonRobust(
        raw_male_shares,
        effective_weights,
        0,
        {
          huber_delta: (options.huber_delta !== undefined) ? options.huber_delta : 0.05,
          lambda: sex_ratio_lambda,
          max_iterations: (options.max_iterations !== undefined) ? options.max_iterations : 200,
          min_value: 0,
          mu: 0.0,
          tolerance: (options.tolerance !== undefined) ? options.tolerance : 1e-5
        }
      );
    }

    if (enforce_bounds) {
      for (let i = 0; i < count; i++) {
        let cohort_bounds = bounds[i] || [0, Infinity];
        let ratio_min = cohort_bounds[0];
        let ratio_max = cohort_bounds[1];

        if (!Number.isFinite(ratio_min) || ratio_min < 0) ratio_min = 0;
        if (!Number.isFinite(ratio_max) || ratio_max < ratio_min) ratio_max = Infinity;

        let share_min = ratio_min/(1 + ratio_min);
        let share_max = ratio_max/(1 + ratio_max);

        male_shares[i] = Math.max(share_min, Math.min(share_max, male_shares[i]));
      }
    }

    //An empty suffix already has an exact zero-density solution
    let smoothed_density = total_density;
    let density_scale = 1;
    let total_scale = 1;
    let did_smooth = !do_not_smooth && k_start < count && suffix_total > 0;

    if (did_smooth) {
      density_scale = suffix_total/suffix_width;

      if (!Number.isFinite(density_scale) || density_scale <= 0) {
        console.error("The density normalisation scale is not representable.");
        density_scale = 1;
      }

      let normalised_density = new Float32Array(count);

      for (let i = k_start; i < count; i++)
        normalised_density[i] = total_density[i]/density_scale;

      smoothed_density = Statistics.whittakerHendersonRobust(
        normalised_density,
        effective_weights,
        k_start,
        {
          huber_delta: (options.huber_delta !== undefined) ? options.huber_delta : 0.05,
          lambda: (options.lambda !== undefined) ? options.lambda : 20.0,
          max_iterations: (options.max_iterations !== undefined) ? options.max_iterations : 200,
          min_value: 0,
          mu: (options.mu !== undefined) ? options.mu : 0.0,
          output: new Float32Array(count),
          tolerance: (options.tolerance !== undefined) ? options.tolerance : 1e-5
        }
      );

      //Restore suffix population without changing the unsmoothed prefix
      if (preserve_total) {
        let smoothed_total = 0;

        for (let i = k_start; i < count; i++)
          smoothed_total += smoothed_density[i]*density_scale*widths[i];

        if (!Number.isFinite(smoothed_total) || smoothed_total <= 0) {
          console.error("Cannot preserve population: graduated suffix has no finite positive mass.");
          total_scale = 1;
        } else {
          total_scale = suffix_total/smoothed_total;
        }
      }
    }

    //Reconstitute cohort totals and allocate between sexes
    for (let i = 0; i < count; i++) {
      let total = raw_totals[i];

      if (did_smooth && i >= k_start)
        total = smoothed_density[i]*density_scale*widths[i]*total_scale;

      let male_value = total*male_shares[i];

      male_out[i] = male_value;
      female_out[i] = total - male_value;
      total_out[i] = total;
    }

    return { female: female_out, male: male_out, total: total_out };
  };
}
