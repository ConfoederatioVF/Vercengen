//Initialise methods
{
	ve.NodeEditor.prototype.getDAGSequence = function () {
		let adjacency = new Map();
		let in_degree = new Map();
		let nodes = ve.NodeEditorDatatype.instances.filter(
			(local_node) => local_node.options.node_editor === this,
		);
		
		for (let i = 0; i < nodes.length; i++) {
			in_degree.set(nodes[i].id, 0);
			adjacency.set(nodes[i].id, new Set());
		}
		
		for (let i = 0; i < nodes.length; i++)
			for (let x = 0; x < nodes[i].connections.length; x++) {
				let local_target_node = nodes[i].connections[x][0];
				if (!in_degree.has(local_target_node.id)) continue;
				
				if (!adjacency.get(nodes[i].id).has(local_target_node.id)) {
					adjacency.get(nodes[i].id).add(local_target_node.id);
					in_degree.set(
						local_target_node.id,
						in_degree.get(local_target_node.id) + 1,
					);
				}
			}
		
		let layers = [];
		let processed_count = 0;
		let queue = [];
		
		for (let i = 0; i < nodes.length; i++)
			if (in_degree.get(nodes[i].id) === 0) queue.push(nodes[i]);
		
		while (queue.length > 0) {
			let layer = [];
			let next_queue = [];
			
			for (let i = 0; i < queue.length; i++) {
				layer.push(queue[i]);
				processed_count++;
				
				let edges = adjacency.get(queue[i].id);
				if (!edges) continue;
				
				edges.forEach((to_id) => {
					in_degree.set(to_id, in_degree.get(to_id) - 1);
					if (in_degree.get(to_id) === 0)
						next_queue.push(ve.NodeEditorDatatype.getNode(to_id, this));
				});
			}
			layers.push(layer);
			queue = next_queue;
		}
		
		if (processed_count !== nodes.length) return undefined;
		return layers;
	};
	
	ve.NodeEditor.prototype.run = async function (arg0_preview_mode) {
		if (this._is_running) return this.main.variables;
		this._is_running = true;
		
		try {
			let dag_sequence = this.getDAGSequence();
			let preview_mode = arg0_preview_mode;
			this.main.variables = {};
			this.main.skipped_nodes = new Set();
			this.main.node_iterations = {}; // Track branch iteration counts
			
			let resolve_arguments = (arg0_node, iteration_index = 0) => {
				let args = [];
				let node = arg0_node;
				
				if (node.value.input_parameters)
					for (let i = 0; i < node.value.input_parameters.length; i++) {
						let local_parameter = node.value.input_parameters[i];
						
						if (node.dynamic_values[i]) {
							let resolved;
							for (let x = 0; x < ve.NodeEditorDatatype.instances.length; x++) {
								let source = ve.NodeEditorDatatype.instances[x];
								if (source.options.node_editor !== this) continue;
								for (let y = 0; y < source.connections.length; y++) {
									let target_data = source.connections[y];
									if (target_data[0].id === node.id && target_data[1] === i + 1) {
										let source_val = this.main.variables[source.id];
										let source_iters = this.main.node_iterations[source.id] || 1;
										
										// Pick specific value for this iteration, or fallback to scalar
										resolved =
											Array.isArray(source_val) && source_iters > 1
												? source_val[iteration_index % source_iters]
												: source_val;
										break;
									}
								}
								if (resolved !== undefined) break;
							}
							args.push(resolved);
						} else if (node.constant_values[i] !== undefined) {
							args.push(node.constant_values[i]);
						} else {
							let local_type = JSON.parse(JSON.stringify(local_parameter.type));
							if (ve.NodeEditorDatatype.types[local_type] === undefined)
								local_type = "any";
							args.push(ve.NodeEditorDatatype.types[local_type]);
						}
					}
				return args;
			};
			
			for (let i = 0; i < dag_sequence.length; i++) {
				let layer = dag_sequence[i];
				
				if (!preview_mode)
					for (let x = 0; x < layer.length; x++) {
						delete layer[x].ui.information.status;
						layer[x].draw();
					}
				
				await Promise.all(
					layer.map(async (local_node) => {
						// Determine if we are inside an iterating branch by checking parents
						let max_iters = 1;
						for (let inst of ve.NodeEditorDatatype.instances) {
							if (inst.options.node_editor !== this) continue;
							for (let conn of inst.connections) {
								if (conn[0].id === local_node.id) {
									max_iters = Math.max(
										max_iters,
										this.main.node_iterations[inst.id] || 1,
									);
								}
							}
						}
						
						let results = [];
						let last_descriptor;
						let is_aborted = false;
						
						// Run the branch logic N times
						for (let iter = 0; iter < max_iters; iter++) {
							let args = resolve_arguments(local_node, iter);
							let sf = local_node.value.special_function;
							let descriptor, value;
							
							try {
								descriptor =
									typeof sf === "function"
										? await sf.call(this, ...args, local_node)
										: sf;
								
								if (descriptor && descriptor.abort === true) {
									is_aborted = true;
									break;
								}
								
								value =
									descriptor && typeof descriptor === "object"
										? descriptor.value
										: descriptor;
								
								if (
									!preview_mode &&
									descriptor &&
									typeof descriptor.run === "function"
								) {
									local_node.ui.information.status = "is_running";
									local_node.draw();
									await descriptor.run();
								}
								results.push(value);
								last_descriptor = descriptor;
							} catch (e) {
								console.error(`Execution failed (${local_node.id})`, e);
								is_aborted = true;
								break;
							}
						}
						
						if (is_aborted) {
							this.main.skipped_nodes.add(local_node.id);
							local_node.ui.information.status = "aborted";
						} else {
							// Check if this node triggers a new iteration count for its branch
							let explicit_iters = Math.returnSafeNumber(
								last_descriptor?.iterations,
								0,
							);
							
							if (explicit_iters > 0) {
								this.main.node_iterations[local_node.id] = explicit_iters;
								// FIX: Instead of .fill(), run remaining iterations to generate unique values
								for (let j = 1; j < explicit_iters; j++) {
									let args = resolve_arguments(local_node, j);
									let sf = local_node.value.special_function;
									let descriptor = await sf.call(this, ...args, local_node);
									results.push(
										descriptor && typeof descriptor === "object"
											? descriptor.value
											: descriptor,
									);
								}
								this.main.variables[local_node.id] = results;
							} else {
								this.main.node_iterations[local_node.id] = max_iters;
								this.main.variables[local_node.id] =
									max_iters > 1 ? results : results[0];
							}
							local_node.ui.information.status = "finished";
						}
						
						if (!preview_mode) {
							local_node.ui.information.alluvial_width = Math.returnSafeNumber(
								last_descriptor?.alluvial_width,
								1,
							);
							local_node.ui.information.value =
								last_descriptor?.display_value !== undefined
									? last_descriptor.display_value
									: this.main.variables[local_node.id];
							local_node.draw();
						}
					}),
				);
			}
		} finally {
			this._is_running = false;
		}
		
		return this.main.variables;
	};
}