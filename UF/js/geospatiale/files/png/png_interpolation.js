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
	 * Dasymetrically blurs border regions where ushc regions are artificial/statistical artefacts.
	 * @alias GeoPNG.dasymetricBlur
	 * 
	 * @param {Object} [arg0_options]
	 *  @param {number[]} [arg0_options.mask_data]
	 *  @param {Float64Array|number[]} [arg0_options.pop_data] - Data referencing population, alternatively any utility in which low values contribute to higher spread of the target variable.
	 *  @param {Float64Array|number[]} [arg0_options.target_data]
	 *  
	 *  @param {number} [arg0_options.height=2160]
	 *  @param {number} [arg0_options.width=4320]
	 *  
	 *  @param {number} [arg0_options.radius=64] - The default brush radius/tolerance.
	 */
	GeoPNG.dasymetricBlur = function (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Initialise options
		options.height = Math.returnSafeNumber(options.height, 2160);
		options.width = Math.returnSafeNumber(options.width, 4320);
		
		options.radius = Math.returnSafeNumber(options.radius, 64);
		
		//Declare local instance variables
		let blurPass = (in_A, in_B, r) => {
			let out_A = new Float32Array(N), out_B = new Float32Array(N);
			let temp_A = new Float32Array(N), temp_B = new Float32Array(N);
			
			for (let y = 0; y < height; y++) {
				let offset = y * width, sum_A = 0, sum_B = 0;
				for (let x = 0; x <= r && x < width; x++) { sum_A += in_A[offset+x]; sum_B += in_B[offset+x]; }
				for (let x = 0; x < width; x++) {
					temp_A[offset+x] = sum_A; temp_B[offset+x] = sum_B;
					if (x + r + 1 < width) { sum_A += in_A[offset+x+r+1]; sum_B += in_B[offset+x+r+1]; }
					if (x - r >= 0) { sum_A -= in_A[offset+x-r]; sum_B -= in_B[offset+x-r]; }
				}
			}
			for (let x = 0; x < width; x++) {
				let sum_A = 0, sum_B = 0;
				for (let y = 0; y <= r && y < height; y++) { let idx = y*width+x; sum_A += temp_A[idx]; sum_B += temp_B[idx]; }
				for (let y = 0; y < height; y++) {
					let idx = y*width+x; out_A[idx] = sum_A; out_B[idx] = sum_B;
					if (y + r + 1 < height) { let n_idx = (y+r+1)*width+x; sum_A += temp_A[n_idx]; sum_B += temp_B[n_idx]; }
					if (y - r >= 0) { let p_idx = (y-r)*width+x; sum_A -= temp_A[p_idx]; sum_B -= temp_B[p_idx]; }
				}
			}
			return {A: out_A, B: out_B};
		};
		let height = options.height;
		let N = options.width*options.height;
		let mask_data = options.mask_data;
		let radius = options.radius;
		let pop_data = options.pop_data;
		let target_data = options.target_data;
		let width = options.width;
		
		// 1. Precise Border Detection & Distance Transform
		let dist = new Float32Array(N).fill(99999);
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				let idx = y * width + x;
				let b_idx = idx * 4;
				let c = (mask_data[b_idx] << 16) | (mask_data[b_idx+1] << 8) | mask_data[b_idx+2];
				if (c === 0) continue;
				
				let is_border = false;
				let neighbors = [
					(y > 0) ? idx - width : -1,
					(y < height - 1) ? idx + width : -1,
					(x > 0) ? idx - 1 : -1,
					(x < width - 1) ? idx + 1 : -1
				];
				
				for (let n of neighbors) {
					if (n !== -1) {
						let n_byte = n * 4;
						let nc = (mask_data[n_byte] << 16) | (mask_data[n_byte+1] << 8) | mask_data[n_byte+2];
						if (nc !== c && nc !== 0) {
							is_border = true;
							break;
						}
					}
				}
				if (is_border) dist[idx] = 0;
			}
		}
		
		let d1 = 3, d2 = 4;
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				let idx = y * width + x;
				if (x > 0) dist[idx] = Math.min(dist[idx], dist[idx - 1] + d1);
				if (y > 0) dist[idx] = Math.min(dist[idx], dist[idx - width] + d1);
				if (x > 0 && y > 0) dist[idx] = Math.min(dist[idx], dist[idx - width - 1] + d2);
				if (x < width - 1 && y > 0) dist[idx] = Math.min(dist[idx], dist[idx - width + 1] + d2);
			}
		}
		for (let y = height - 1; y >= 0; y--) {
			for (let x = width - 1; x >= 0; x--) {
				let idx = y * width + x;
				if (x < width - 1) dist[idx] = Math.min(dist[idx], dist[idx + 1] + d1);
				if (y < height - 1) dist[idx] = Math.min(dist[idx], dist[idx + width] + d1);
				if (x < width - 1 && y < height - 1) dist[idx] = Math.min(dist[idx], dist[idx + width + 1] + d2);
				if (x > 0 && y < height - 1) dist[idx] = Math.min(dist[idx], dist[idx + width - 1] + d2);
			}
		}
		for (let i = 0; i < N; i++) dist[i] /= 3.0;
		
		// 2. Uniform Double-Box Blur (The "Brush")
		let A = new Float32Array(N);
		let B = new Float32Array(N);
		for (let i = 0; i < N; i++) {
			if (target_data[i] > 0) {
				A[i] = target_data[i];
				B[i] = 1.0;
			}
		}
		
		let pass1 = blurPass(A, B, radius);
		let pass2 = blurPass(pass1.A, pass1.B, radius);
		
		// 3. Apply the Smart Brush (Interpolate Alpha via Distance & Population)
		let output_data = new Float32Array(N);
		
		let log_min = Math.log10(5);
		let log_max = Math.log10(5000);
		
		for (let i = 0; i < N; i++) {
			if (target_data[i] === 0) {
				output_data[i] = 0;
				continue;
			}
			
			let d = dist[i];
			if (d >= radius) {
				output_data[i] = target_data[i];
			} else {
				let V_raw = target_data[i];
				let V_blur = (pass2.B[i] > 0) ? (pass2.A[i] / pass2.B[i]) : V_raw;
				
				let p = pop_data[i];
				let log_p = Math.log10(Math.max(1, p));
				
				let a_pop = (log_p - log_min) / (log_max - log_min);
				a_pop = Math.max(0, Math.min(1, a_pop));
				
				let a_dist = d / radius;
				
				// Raw factor approaches 1 in cities OR inland. Approaches 0 strictly near borders in wilderness.
				let raw_factor = Math.max(a_pop, a_dist);
				raw_factor = raw_factor * raw_factor * (3 - 2 * raw_factor); // Smoothstep
				
				output_data[i] = (V_raw * raw_factor) + (V_blur * (1.0 - raw_factor));
			}
		}
		
		//Return statement
		return output_data;
	};
}