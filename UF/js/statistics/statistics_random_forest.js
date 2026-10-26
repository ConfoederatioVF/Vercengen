//Initialise functions
{
	if (!global.Statistics)
		/**
		 * The namespace for all UF/Statistics utility functions, typically for static methods.
		 *
		 * @namespace Statistics
		 */
		global.Statistics = {};

	class DecisionTreeRegressor {
		constructor (arg0_min_samples_split, arg1_max_depth, arg2_mtry) {
			this.min_samples_split = arg0_min_samples_split || 2;
			this.max_depth = arg1_max_depth || 10;
			this.mtry = arg2_mtry || null;
			this.tree = null;
		}

		_buildTree (arg0_X, arg1_y, arg2_depth) {
			let X = arg0_X;
			let y = arg1_y;
			let depth = arg2_depth;
			
			let num_samples = X.length;
			let num_features = X[0].length;
			
			let variance = this._variance(y);
			if (num_samples >= this.min_samples_split && depth < this.max_depth && variance > 0.0001) {
				let best_split = this._getBestSplitFast(X, y, num_samples, num_features);
				if (best_split && best_split.variance_reduction > 0) {
					let left_subtree = this._buildTree(best_split.left_X, best_split.left_y, depth + 1);
					let right_subtree = this._buildTree(best_split.right_X, best_split.right_y, depth + 1);
					
					return {
						feature_index: best_split.feature_index,
						left: left_subtree,
						right: right_subtree,
						threshold: best_split.threshold,
						is_leaf: false
					};
				}
			}
			
			return {
				value: this._calculateLeafValue(y),
				is_leaf: true
			};
		}
		
		_calculateLeafValue (arg0_y) {
			let y = arg0_y;
			
			if (y.length === 0) return 0;
			let sum = 0;
			for (let i = 0; i < y.length; i++) sum += y[i];
			return sum / y.length;
		}

		_getBestSplitFast (arg0_X, arg1_y, arg2_num_samples, arg3_num_features) {
			let X = arg0_X;
			let y = arg1_y;
			let num_samples = arg2_num_samples;
			let num_features = arg3_num_features;
			
			let best_split = { variance_reduction: -1 };
			let max_var_red = -Infinity;
			
			let feature_indices = Array.from({ length: num_features }, (_, i) => i);
			if (this.mtry && this.mtry < num_features) {
				feature_indices.sort(() => Math.random() - 0.5);
				feature_indices = feature_indices.slice(0, this.mtry);
			}
			
			let parent_sum = 0;
			let parent_sum_sq = 0;
			for (let i = 0; i < num_samples; i++) {
				parent_sum += y[i];
				parent_sum_sq += y[i] * y[i];
			}
			let parent_var = (parent_sum_sq - (parent_sum * parent_sum) / num_samples) / num_samples;
			
			for (let f = 0; f < feature_indices.length; f++) {
				let idx = feature_indices[f];
				let pairs = [];
				for (let i = 0; i < num_samples; i++) {
					pairs.push({ index: i, x: X[i][idx], y: y[i] });
				}
				pairs.sort((a, b) => a.x - b.x);
				
				let left_sum = 0;
				let left_sum_sq = 0;
				let left_count = 0;
				
				for (let i = 0; i < num_samples - 1; i++) {
					let val_y = pairs[i].y;
					left_sum += val_y;
					left_sum_sq += val_y * val_y;
					left_count++;
					
					if (pairs[i].x !== pairs[i + 1].x) {
						let right_count = num_samples - left_count;
						let right_sum = parent_sum - left_sum;
						let right_sum_sq = parent_sum_sq - left_sum_sq;
						
						let left_var = (left_sum_sq - (left_sum * left_sum) / left_count) / left_count;
						let right_var = (right_sum_sq - (right_sum * right_sum) / right_count) / right_count;
						
						let var_red = parent_var - ((left_count / num_samples) * left_var + (right_count / num_samples) * right_var);
						
						if (var_red > max_var_red) {
							max_var_red = var_red;
							best_split = {
								feature_index: idx,
								_temp_threshold: (pairs[i].x + pairs[i + 1].x) / 2,
								variance_reduction: var_red
							};
						}
					}
				}
			}
			
			if (max_var_red > 0) {
				best_split.left_X = [];
				best_split.left_y = [];
				best_split.right_X = [];
				best_split.right_y = [];
				
				for (let i = 0; i < num_samples; i++) {
					if (X[i][best_split.feature_index] <= best_split._temp_threshold) {
						best_split.left_X.push(X[i]);
						best_split.left_y.push(y[i]);
					} else {
						best_split.right_X.push(X[i]);
						best_split.right_y.push(y[i]);
					}
				}
				best_split.threshold = best_split._temp_threshold;
			}
			
			return best_split;
		}

		_predict_row (arg0_x, arg1_tree) {
			let x = arg0_x;
			let tree = arg1_tree;
			
			if (tree.is_leaf) return tree.value;
			let feature_val = x[tree.feature_index];
			
			if (feature_val <= tree.threshold) {
				return this._predict_row(x, tree.left);
			} else {
				return this._predict_row(x, tree.right);
			}
		}

		_variance (arg0_y) {
			let y = arg0_y;
			let len = y.length;
			if (len <= 1) return 0;
			let sum = 0;
			let sum_sq = 0;
			for (let i = 0; i < len; i++) {
				let val = y[i];
				sum += val;
				sum_sq += val * val;
			}
			let v = (sum_sq - (sum * sum) / len) / len;
			return (v > 0) ? v : 0;
		}

		fit (arg0_X, arg1_y) {
			let X = arg0_X;
			let y = arg1_y;
			
			this.tree = this._buildTree(X, y, 0);
		}

		predict (arg0_X) {
			let X = arg0_X;
			
			return X.map(x => this._predict_row(x, this.tree));
		}
	}

	class RandomForestRegressor {
		constructor (arg0_options) {
			let options = (arg0_options) ? arg0_options : {};
			
			this.max_depth = Math.returnSafeNumber(options.max_depth, 10);
			this.min_samples_split = Math.returnSafeNumber(options.min_samples_split, 2);
			this.mtry = Math.returnSafeNumber(options.mtry, null);
			this.n_trees = Math.returnSafeNumber(options.n_trees, 10);
			this.trees = [];
		}

		fit (arg0_X, arg1_y) {
			let X = arg0_X;
			let y = arg1_y;
			
			this.trees = [];
			let n_samples = X.length;
			
			for (let i = 0; i < this.n_trees; i++) {
				let X_sample = [];
				let y_sample = [];
				
				for (let j = 0; j < n_samples; j++) {
					let idx = Math.floor(Math.random() * n_samples);
					X_sample.push(X[idx]);
					y_sample.push(y[idx]);
				}
				
				let tree = new DecisionTreeRegressor(this.min_samples_split, this.max_depth, this.mtry);
				tree.fit(X_sample, y_sample);
				this.trees.push(tree);
			}
		}

		predict (arg0_X) {
			let X = arg0_X;
			
			let preds = this.trees.map(t => t.predict(X));
			let avg_preds = [];
			let n_trees = this.trees.length;
			
			for (let i = 0; i < X.length; i++) {
				let sum = 0;
				for (let j = 0; j < n_trees; j++) {
					sum += preds[j][i];
				}
				avg_preds.push(sum / n_trees);
			}
			
			return avg_preds;
		}
	}

	/**
	 * Trains a Random Forest Regressor and outputs it as a JSON object.
	 * @alias Statistics.trainRandomForest
	 *
	 * @param {string} arg0_output_file_path
	 * @param {Object} arg1_data
	 * @param {Array<Array<number>>} arg1_data.X
	 * @param {Array<number>} arg1_data.Y
	 * @param {Array<string>} arg1_data.keys
	 * @param {Object} [arg2_options]
	 *
	 * @returns {Object}
	 */
	Statistics.trainRandomForest = async function (arg0_output_file_path, arg1_data, arg2_options) {
		//Convert from parameters
		let output_file_path = arg0_output_file_path;
		let data = arg1_data;
		let options = (arg2_options) ? arg2_options : {};

		//Declare local instance variables
		let max_depth = Math.returnSafeNumber(options.max_depth, 10);
		let min_samples_split = Math.returnSafeNumber(options.min_samples_split, 2);
		let mtry = Math.returnSafeNumber(options.mtry, Math.max(1, Math.floor(data.keys.length / 3)));
		let n_trees = Math.returnSafeNumber(options.n_trees, 25);
		
		let rf = new RandomForestRegressor({
			max_depth: max_depth,
			min_samples_split: min_samples_split,
			mtry: mtry,
			n_trees: n_trees
		});
		
		rf.fit(data.X, data.Y);
		
		//Calculate train MSE
		let preds = rf.predict(data.X);
		let sum_sq_err = 0;
		for (let i = 0; i < preds.length; i++) {
			sum_sq_err += Math.pow(preds[i] - data.Y[i], 2);
		}
		let mse = sum_sq_err / preds.length;
		
		let model_obj = {
			keys: data.keys,
			metrics: {
				mse: mse,
				rmse: Math.sqrt(mse)
			},
			parameters: {
				max_depth: max_depth,
				min_samples_split: min_samples_split,
				mtry: mtry,
				n_trees: n_trees
			},
			trees: rf.trees.map(t => t.tree),
			type: "random_forest"
		};
		
		if (output_file_path) {
			let fs = require("fs");
			fs.writeFileSync(output_file_path, JSON.stringify(model_obj));
		}
		
		//Return statement
		return model_obj;
	};

	/**
	 * Evaluates a Random Forest model given a row of covariates.
	 * @alias Statistics.evaluateRandomForest
	 *
	 * @param {Object} arg0_model_obj
	 * @param {Object} arg1_covariates_obj
	 *
	 * @returns {number}
	 */
	Statistics.evaluateRandomForest = function (arg0_model_obj, arg1_covariates_obj) {
		//Convert from parameters
		let model_obj = arg0_model_obj;
		let covariates_obj = arg1_covariates_obj;
		
		//Declare local instance variables
		let keys = model_obj.keys;
		let num_keys = keys.length;
		let num_trees = model_obj.trees.length;
		let X_row = new Float64Array(num_keys);
		
		for (let i = 0; i < num_keys; i++) {
			let val = covariates_obj[keys[i]];
			if (val === undefined || isNaN(val)) return NaN;
			X_row[i] = val;
		}
		
		let sum = 0;
		for (let i = 0; i < num_trees; i++) {
			let node = model_obj.trees[i];
			while (!node.is_leaf) {
				if (X_row[node.feature_index] <= node.threshold) {
					node = node.left;
				} else {
					node = node.right;
				}
			}
			sum += node.value;
		}
		
		//Return statement
		return sum / num_trees;
	};

	/**
	 * Evaluates a Superlearner model given a row of covariates.
	 * @alias Statistics.evaluateSuperlearner
	 *
	 * @param {Object} arg0_model_obj
	 * @param {Object} arg1_covariates_obj
	 *
	 * @returns {number}
	 */
	Statistics.evaluateSuperlearner = function (arg0_model_obj, arg1_covariates_obj) {
		//Convert from parameters
		let model_obj = arg0_model_obj;
		let covariates_obj = arg1_covariates_obj;
		
		//Declare local instance variables
		let evaluateOLS = function (linear_model, row_obj) {
			let val = 0;
			if (linear_model.intercept) val += linear_model.intercept;
			if (linear_model.coefficients) {
				let all_keys = Object.keys(linear_model.coefficients);
				for (let i = 0; i < all_keys.length; i++) {
					let key = all_keys[i];
					let cov_val = row_obj[key];
					if (cov_val !== undefined && !isNaN(cov_val))
						val += cov_val * (linear_model.coefficients[key] || 0);
				}
			} else if (Array.isArray(linear_model.keys) && Array.isArray(linear_model.weights)) {
				for (let i = 0; i < linear_model.keys.length; i++) {
					let key = linear_model.keys[i];
					let cov_val = row_obj[key];
					if (cov_val !== undefined && !isNaN(cov_val))
						val += cov_val * (linear_model.weights[i] || 0);
				}
			}
			return val;
		};
		
		let linear_pred = evaluateOLS(model_obj.linear_model, covariates_obj);
		let rf_pred = Statistics.evaluateRandomForest(model_obj.rf_model, covariates_obj);
		
		if (isNaN(linear_pred) || isNaN(rf_pred)) return NaN;
		
		let weight_linear = model_obj.weights.linear;
		let weight_rf = model_obj.weights.rf;
		
		//Return statement
		return (linear_pred * weight_linear) + (rf_pred * weight_rf);
	};

	/**
	 * Trains a Superlearner model blending OLS and Random Forest regression.
	 * @alias Statistics.trainSuperlearner
	 *
	 * @param {string} arg0_output_file_path
	 * @param {Object} arg1_data
	 * @param {Array<Array<number>>} arg1_data.X
	 * @param {Array<number>} arg1_data.Y
	 * @param {Array<string>} arg1_data.keys
	 * @param {Object} [arg2_options]
	 *
	 * @returns {Object}
	 */
	Statistics.trainSuperlearner = async function (arg0_output_file_path, arg1_data, arg2_options) {
		//Convert from parameters
		let output_file_path = arg0_output_file_path;
		let data = arg1_data;
		let options = (arg2_options) ? arg2_options : {};
		
		//Declare local instance variables
		let linear_options = options.linear_options || { fit_intercept: true, lambda: 1e-4 };
		let rf_options = options.rf_options || { max_depth: 8, min_samples_split: 5, n_trees: 15 };
		
		let rf_model = await Statistics.trainRandomForest(null, data, rf_options);
		let linear_model = await Statistics.trainOLSModel(null, data, linear_options);
		
		//Inverse RMSE weighting
		let rf_rmse = rf_model?.metrics?.rmse || 1;
		let linear_rmse = linear_model?.metrics?.rmse;
		
		if (linear_rmse === undefined || isNaN(linear_rmse)) {
			let sum_sq_err = 0;
			let n_samples = data.X.length;
			for (let i = 0; i < n_samples; i++) {
				let pred = 0;
				for (let j = 0; j < data.keys.length; j++) {
					let key = data.keys[j];
					let coeff = (linear_model?.coefficients && linear_model.coefficients[key] !== undefined)
						? linear_model.coefficients[key]
						: 0;
					pred += data.X[i][j] * coeff;
				}
				sum_sq_err += Math.pow(pred - data.Y[i], 2);
			}
			linear_rmse = Math.sqrt(sum_sq_err / Math.max(1, n_samples));
			if (!linear_model) linear_model = {};
			if (!linear_model.metrics) linear_model.metrics = {};
			linear_model.metrics.rmse = linear_rmse;
		}
		
		let weight_linear = 0.5;
		let weight_rf = 0.5;
		
		if (rf_rmse > 0 && linear_rmse > 0) {
			let inv_rf = 1 / rf_rmse;
			let inv_linear = 1 / linear_rmse;
			let total_inv = inv_rf + inv_linear;
			
			weight_rf = inv_rf / total_inv;
			weight_linear = inv_linear / total_inv;
		}
		
		let model_obj = {
			keys: data.keys,
			linear_model: linear_model,
			metrics: {
				linear_rmse: linear_rmse,
				rf_rmse: rf_rmse,
				sample_count: data.X.length
			},
			rf_model: rf_model,
			sample_count: data.X.length,
			type: "superlearner",
			weights: {
				linear: weight_linear,
				rf: weight_rf
			}
		};
		
		if (output_file_path) {
			let fs = require("fs");
			fs.writeFileSync(output_file_path, JSON.stringify(model_obj));
		}
		
		//Return statement
		return model_obj;
	};
}
