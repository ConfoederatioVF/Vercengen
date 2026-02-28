//Initialise functions
{
	/**
	 * Represents Ontologies which have been hydrated and streamed-in from a set database.
	 * 
	 * ##### Constructor:
	 * - `arg0_type="Ontology"`: {@link string} - The Ontology subclass/type to reference.
	 * - `arg1_state_array`: {@link Array}<{ date: {@link number}, data: {@link Object}, ...argn_fields }>
	 *   - `argn_fields`:
	 *     - `.add_relations`: { id: {@link string}, type: {@link string} }
	 *     - `.add_tags`: {@link Array}<{@link string}>
	 *     - `.remove_relations`: { id: {@link string}, ... }|{@link Array}<{@link string}>
	 *     - `.remove_tags`: {@link Array}<{@link string}>
	 *     - `.set_tags`: {@link Array}<{@link string}> - Override.
	 *     - `.set_relations`: { id: {@link string}, type: {@link string} } - Override.
	 * - `arg2_options`: {@link Object}
	 *   - `.id=Ontology.getOntologyID()`: {@link string} - The manual ID to override the default assignment.
	 *   - `.worker_type=""`: {@link string} - The worker from which the Ontology originated.
	 *   
	 * ##### Instance:
	 * - `.options`: {@link Object}
	 * - `.type`: {@link string}
	 * - 
	 * - `.id`: {@link string}
	 * - `.geometries`: {@link Array}<{@link maptalks.Geometry}>
	 * - `.state`: {@link Array}<{@link Object}>
	 * - `.worker_type`: {@link string}
	 * 
	 * ##### Methods:
	 * - <span color=00ffff>{@link Ontology._rebuildDiffsFromSnapshots|_rebuildDiffsFromSnapshots}</span> | {@link Object}(arg0_snapshots:{@link Array}<{@link Object}>)
	 * - <span color=00ffff>{@link Ontology._resolveAllSnapshots|_resolveAllSnapshots}</span>() | {@link Array}<{@link Object}>
	 * - <span color=00ffff>{@link Ontology._resolveStateAtIndex|_resolveStateAtIndex}</span>(arg0_index:{@link number}) | {@link Object}
	 * - <span color=00ffff>{@link Ontology._sortState|_sortState}</span>()
	 * - <span color=00ffff>{@link Ontology.addKeyframe|addKeyframe}</span>(arg0_date:{@link Date}, arg1_date:{@link Date}) | {@link Object}
	 * - <span color=00ffff>{@link Ontology.addRelation|addRelation}</span>(arg0_date:{@link Date}, arg1_relation_obj:{@link Object}) | {@link Object}
	 * - <span color=00ffff>{@link Ontology.deleteKeyframe|deleteKeyframe}</span>(arg0_date:{@link Date}) | {@link boolean}
	 * - <span color=00ffff>{@link Ontology.draw|draw}</span>() | {@link Array}<{@link maptalks.Geometry}>
	 * - <span color=00ffff>{@link Ontology.getElement|getElement}</span>() | {@link HTMLElement}
	 * - <span color=00ffff>{@link Ontology.getFirstKeyframeWithProperty|getFirstKeyframeWithProperty}</span>(arg0_property:{@link Object})
	 * - <span color=00ffff>{@link Ontology.getLastKeyframeWithProperty|getLastKeyframeWithProperty}</span>(arg0_property:{@link Object})
	 * - <span color=00ffff>{@link Ontology.getTimelineElement|getTimelineElement}</span>(arg0_options:{@link Object}) | {@link HTMLElement}
	 * - <span color=00ffff>{@link Ontology.getState|getState}</span>(arg0_date:{@link Date}) | {@link Object}
	 * - <span color=00ffff>{@link Ontology.getTimelineElement|getTimelineElement}</span>(arg0_options:{@link Object})
	 * - <span color=00ffff>{@link Ontology.jumpToKeyframe|jumpToKeyframe}</span>(arg0_date:{@link Date}) | {@link Object}|{@link null}
	 * - <span color=00ffff>{@link Ontology.moveKeyframe|moveKeyframe}</span>(arg0_date:{@link Date}, arg1_date:{@link Date}) | {@link boolean}
	 * - <span color=00ffff>{@link Ontology.remove|remove}</span>()
	 * - <span color=00ffff>{@link Ontology.removeRelation|removeRelation}</span>(arg0_relation:{@link string}, arg1_date:{@link Date})
	 * - <span color=00ffff>{@link Ontology.removeRleations|removeRelations}</span>(arg0_relations:{@link Array}<{@link string}>, arg1_date:{@link Date})
	 * 
	 * ##### Static Fields:
	 * - `.initialised=false`: {@link boolean}
	 * - `.instances`: {@link Array}<{@link Ontology}>
	 * - `.ontology_folder_path=""`: {@link string}
	 * - `.queue`: {@link Array}<{@link Ontology}> - Queued Ontologies waiting to be saved and passed into `.instances`.
	 * 
	 * ##### Static Methods:
	 * - <span color=00ffff>{@link Ontology.applyMutations|applyMutations}</span>(arg0_resolved_data:{@link Object}, arg1_mutations:{@link Object}) | {@link Object}
	 * - <span color=00ffff>{@link Ontology.getOntologyID|getOntologyID}</span>() | {@link string}
	 * - <span color=00ffff>{@link Ontology.initialise|initialise}</span>()
	 * 
	 * @type {Ontology}
	 */
	global.Ontology = class {
		/**
		 * [WIP] - Ontology needs a way to stream data to/from daily files.
		 * - static fromDatabase()
		 * - static getOntologyFromDatabase(arg0_ontology_id)
		 * - saveToDatabase()
		 * [WIP] - Ontologies with the same ID when constructed should have their states diffed and merged.
		 * [WIP] - Modify logic loop to also save current Ontologies to databases.
		 */
		
		/**
		 * @type {boolean}
		 */
		static initialised = false;
		
		/**
		 * @type {Ontology[]}
		 */
		static instances = [];
		
		/**
		 * @type {string}
		 */
		static ontology_folder_path = "";
		
		/**
		 * @type {Ontology[]}
		 */
		static queue = [];
		
		constructor (arg0_type, arg1_state_array, arg2_options) {
			//Convert from parameters
			let type = (arg0_type) ? arg0_type : "Ontology";
			let state_array = (arg1_state_array) ? arg1_state_array : [];
			let options = (arg2_options) ? arg2_options : {};
			
			//Initialise Ontology first
			if (!Ontology.initialised) Ontology.initialise();
			
			//Declare local instance variables
			this.options = options;
			this.type = type;
			
			this.id = (this.options.id) ? this.options.id : Ontology.getOntologyID();
			this.geometries = [];
			this.state = (state_array) ? state_array : [];
				if (!Array.isArray(this.state)) {
					if (typeof this.state === "string") this.state = JSON.parse(this.state);
					if (typeof this.state === "object") this.state = [this.state];
				}
			this.worker_type = (this.options.worker_type) ? this.options.worker_type : "";
				
			this._sortState(); //Sort state ascending by date, last entry is the head
				
			//Queue-based ID assignment
			Ontology.queue.push(this);
		}
		
		/**
		 * Given an array of fully-resolved snapshots (one per keyframe, indexed automatically to `this.state`), rewrite every keyframe's data so that the last entry is the full snapshot and every earlier entry is a negative diff against its successor.
		 * @private
		 * 
		 * @param {Object[]} arg0_snapshots
		 * 
		 * @returns {Object}
		 */
		_rebuildDiffsFromSnapshots (arg0_snapshots) {
			//Convert from parameters
			let snapshots = (arg0_snapshots) ? arg0_snapshots : [];
			
			if (snapshots.length === 0) return; //Internal guard clause
			
			//Declare local instance variables
			let last_index = snapshots.length - 1;
			
			//Head = full snapshot
			this.state[last_index].data = structuredClone(snapshots[last_index]);
			
			//Every earlier keyframe = negative diff against next resolved state
			for (let i = last_index - 1; i >= 0; i--)
				this.state[i].data = Object.computeNegativeDiff(snapshots[i], snapshots[i + 1]);
			
			//Strip mutation fielkds - they've already been baked in
			for (let local_keyframe of this.state) {
				delete local_keyframe.add_relations;
				delete local_keyframe.add_tags;
				delete local_keyframe.remove_relations;
				delete local_keyframe.remove_tags;
				delete local_keyframe.set_relations;
				delete local_keyframe.set_tags;
			}
			
			//Return statement
			return this.state;
		}
		
		/**
		 * Fully resolve every keyframe, return the array of snapshots.
		 * @private
		 * 
		 * @returns {Object[]}
		 */
		_resolveAllSnapshots () {
			//Declare local instance variables
			let snapshots = [];
			
			//Iterate over the present state and push all resolved states to snapshots
			for (let i = 0; i < this.state.length; i++)
				snapshots.push(this._resolveStateAtIndex(i));
			
			//Return statement
			return snapshots;
		}
		
		/**
		 * Resolves the state at a given index and returns it.
		 * @private
		 * 
		 * @param {number} [arg0_index=0]
		 * 
		 * @returns {Object}
		 */
		_resolveStateAtIndex (arg0_index) {
			//Convert from parameters
			let index = Math.returnSafeNumber(arg0_index);
			
			if (this.state.length === 0) return {}; //Internal guard clause if state is empty
			if (index < 0 || index > this.state.length - 1) return {}; //Internal guard clause if state is invalid
			
			//Declare local instance variables
			let resolved = structuredClone(this.state[this.state.length - 1].data || {});
			
			//Walk backwards from head towards the requested index, applying each keyframe's stored diff to regress the state
			for (let i = this.state.length - 2; i >= index; i--) {
				let diff = (this.state[i].data || {});
				
				Object.iterate(diff, (local_key, local_value) => {
					if (local_value === null) {
						delete resolved[local_key]; //Null sentinel = key did not exist at that keyframe
					} else {
						resolved[local_key] = structuredClone(local_value);
					}
				});
			}
			
			//Return statement
			return resolved;
		}
		
		/**
		 * Sorts `this.state` in ascending order by `.date`. Last = head.
		 * @private
		 */
		_sortState () { this.state.sort((a, b) => a.date - b.date); }
		
		/**
		 * Adds a new keyframe/state mutation at the given date, typically the head state. The provided `arg1_data` and optional relation/tag mutations are merged into the resolved timeline, and the entire diff chain is rebuilt so the head remains the latest full snapshot.
		 * 
		 * @param {Date|any} arg0_date
		 * @param {Object} arg1_data
		 * @param {Object} [arg2_options]
		 *  @param {Object[]} [arg2_options.add_relations]
		 *  @param {string[]} [arg2_options.add_tags]
		 *  @param {Object[]|string[]} [arg2_options.remove_relations]
		 *  @param {string[]} [arg2_options.remove_tags]
		 *  @param {Object[]} [arg2_options.set_relations]
		 *  @param {string[]} [arg2_options.set_tags]
		 * 
		 * @returns {Object}
		 */
		addKeyframe (arg0_date, arg1_data, arg2_options) {
			//Convert from parameters
			let date = Date.getDate(arg0_date).getTime();
			let data_obj = (arg1_data) ? structuredClone(arg1_data) : {};
			let options = (arg2_options) ? arg2_options : {};
			
			//Declare local instance variables
			let insert_index = this.state.length;
			let snapshots = this._resolveAllSnapshots();
			
			//Iterate over this.state and overwrite existing keyframes
			for (let i = 0; i < this.state.length; i++)
				if (this.state[i].date === date) {
					insert_index = i; //Overwrite existing keyframe at this date
					break;
				} else if (this.state[i].date > date) {
					insert_index = i;
					break;
				}
			
			//Resolve the base state at this date (what would have been active just before this keyframe)
			let base_state = {};
		
			if (insert_index > 0 && insert_index <= snapshots.length) {
				//Use the snapshot of the previous keyframe
				base_state = structuredClone(snapshots[Math.min(insert_index, snapshots.length) - 1]);
			} else if (insert_index === 0 && snapshots.length > 0) {
				base_state = {};
			}
			
			//Merge data onto base, then apply relation/tag mutations
			let is_overwrite = (insert_index < this.state.length && this.state[insert_index].date === date);
			let new_keyframe = { date: date, data: {} };
			let new_snapshot = Object.assign({}, base_state, data_obj);
				new_snapshot = Ontology.applyMutations(new_snapshot, options);
				
			if (is_overwrite) {
				this.state[insert_index] = new_keyframe;
				snapshots[insert_index] = new_snapshot;
			} else {
				this.state.splice(insert_index, 0, new_keyframe);
				snapshots.splice(insert_index, 0, new_snapshot);
			}
			
			//Rebuild negative diffs from the snapshot array
			this._rebuildDiffsFromSnapshots(snapshots);
			
			//Return statement
			return this.state[insert_index];
		}
		
		/**
		 * Adds a relation object to the selected date.
		 * 
		 * @param {Date|any} arg0_date
		 * @param {{id: string, data: Object}} arg1_relation_obj
		 */
		addRelation (arg0_date, arg1_relation_obj) {
			//Convert from parameters
			let date = (arg0_date) ? Date.getDate(arg0_date).getTime() : Date.now();
			let relation_obj = arg1_relation_obj;
			
			if (!relation_obj) return; //Internal guard clause if relation is null
			
			//Declare local instance variables
			let current_state = this.getState(date);
			
			this.addKeyframe(date, current_state, { add_relations: [relation_obj] });
		}
		
		/**
		 * Deletes the keyframe at the given date.
		 * 
		 * @param {Date|any} arg0_date
		 * 
		 * @returns {boolean}
		 */
		deleteKeyframe (arg0_date) {
			//Convert from parameters
			let date = Date.getDate(arg0_date).getTime();
			
			//Declare local instance variables
			let index = this.state.findIndex((local_keyframe) => local_keyframe.date === date);
				if (index === -1) return false; //Internal guard clause if index could not be deleted
			let snapshots = this._resolveAllSnapshots();
			
			//Remove keyframe
			this.state.splice(index, 1);
			snapshots.splice(index, 1);
			
			if (this.state.length > 0) this._rebuildDiffsFromSnapshots(snapshots);
			
			//Return statement
			return true;
		}
		
		/**
		 * Draws the Ontology. Should be overridden by subclasses.
		 */
		draw () { return this.geometries; }
		
		/**
		 * Returns an HTMLElement representing this Ontology.
		 * 
		 * @param {Object} [arg0_options]
		 *  @param {boolean} [arg0_options.do_not_show_timeline=false]
		 *  @param {Date|any} [arg0_options.end_date]
		 *  @param {Date|any} [arg0_options.start_date]
		 *  
		 * @returns {HTMLElement}
		 */
		getElement (arg0_options) {
			//Convert from parameters
			let options = (arg0_options) ? arg0_options : {};
			
			//Declare local instance variables
			let container_el = document.createElement("div");
				container_el.classList.add("ontology-element");
				container_el.dataset.id = this.id;
			let header_el = document.createElement("div");
				header_el.classList.add("ontology-header");
				header_el.textContent = `Type: ${this.type} | ID: ${this.id}`;
				container_el.appendChild(header_el);
			let state_el = document.createElement("pre");
				state_el.className = "ontology-state";
				let head_index = this.state.length - 1;
				state_el.textContent = (head_index >= 0) ? JSON.stringify(this.state[head_index].data, null, 2) : "{}";
				container_el.appendChild(state_el);
			
			//Timeline (unless suppressed)
			if (!options.do_not_show_timeline) container_el.appendChild(this.getTimelineElement(options));
			
			//Return statement
			return container_el;
		}
		
		/**
		 * Returns the first keyframe whose resolved state contains the given property key.
		 * 
		 * @param {string} arg0_property
		 * 
		 * @returns {{data: Object, date: Date, index: number}|null}
		 */
		getFirstKeyframeWithProperty (arg0_property) {
			//Convert from parameters
			let property = arg0_property;
			
			//Iterate over this.state from beginning
			for (let i = 0; i < this.state.length; i++) {
				let resolved_obj = this._resolveStateAtIndex(i);
				
				//Return statement
				if (resolved_obj[property] !== undefined && resolved_obj[property] !== null)
					return {
						data: resolved_obj,
						date: this.state[i].date,
						index: i
					};
			}
			return null;
		}
		
		/**
		 * Returns the last keyframe whose resolved state contains the given property key.
		 *
		 * @param {string} arg0_property
		 *
		 * @returns {{data: Object, date: Date, index: number}|null}
		 */
		getLastKeyframeWithProperty (arg0_property) {
			//Convert from parameters
			let property = arg0_property;
			
			//Iterate over this.state from latest
			for (let i = this.state.length - 1; i >= 0; i--) {
				let resolved_obj = this._resolveStateAtIndex(i);
				
				//Return statement
				if (resolved_obj[property] !== undefined && resolved_obj[property] !== null)
					return {
						data: resolved_obj,
						date: this.state[i].date,
						index: i
					};
			}
			return null;
		}
		
		/**
		 * Returns the fully-resolved state at a given date. If the date fails between two keyframes, the earlier keyframe's resolved state is returned. If the date is past the head, the head snapshot is returned. If before all keyframes, an empty object is returned.
		 *
		 * @param {Date|any} arg0_date
		 *
		 * @returns {Object}
		 */
		getState (arg0_date) {
			//Convert from parameters
			let date = Date.getDate(arg0_date);
			
			if (this.state.length === 0) return {}; //Internal guard clause if state is empty
			
			//Declare local instance variables
			let current_timestamp = date.getTime();
			let target_index = -1;
			
			//Find the last keyframe whose date <= current_timestamp
			for (let i = this.state.length - 1; i >= 0; i--)
				if (this.state[i].date <= current_timestamp) {
					target_index = i;
					break;
				}
			if (target_index === -1) return {};
			
			//Return statement
			return this._resolveStateAtIndex(target_index);
		}
		
		/**
		 * Returns an {@link HTMLElement} representing this Ontology's timeline.
		 * 
		 * @param {Object} [arg0_options]
		 *  @param {Date|any} [arg0_options.start_date]
		 *  @param {Date|any} [arg0_options.end_date]
		 *  
		 * @returns {HTMLElement}
		 */
		getTimelineElement (arg0_options) {
			//Convert from parameters
			let options = (arg0_options) ? arg0_options : {};
			
			//Initialise options
			options.end_date = (options.end_date !== undefined) ?
				Date.getDate(options.end_date).getTime() : Infinity;
			options.start_date = (options.start_date !== undefined) ? 
				Date.getDate(options.start_date).getTime() : -Infinity;
			
			//Declare local instance variables
			let timeline_el = document.createElement("div");
				timeline_el.classList.add("ontology-timeline");
				
			//Iterate over all keyframes in state
			for (let i = 0; i < this.state.length; i++) {
				let local_keyframe = this.state[i];
				if (local_keyframe.date < options.start_date || local_keyframe.date > options.end_date) continue;
				
				let local_keyframe_el = document.createElement("div");
					local_keyframe_el.classList.add("ontology-keyframe");
					local_keyframe_el.dataset.date = local_keyframe.date;
					local_keyframe_el.dataset.index = i.toString();
				
				let label_el = document.createElement("span");
					label_el.classList.add("ontology-keyframe-date");
					label_el.textContent = new Date(local_keyframe.date).toISOString();
					local_keyframe_el.appendChild(label_el);
				
				if (i === this.state.length - 1) local_keyframe_el.classList.add("ontology-keyframe-head");
				timeline_el.appendChild(local_keyframe_el);
			}
			
			//Return statement
			return timeline_el;
		}
		
		/**
		 * Jumps to a specific keyframe and calls the draw function for the Ontology.
		 * 
		 * @param arg0_date
		 * @returns {{data: Object, date: Date, index: number}|null}
		 */
		jumpToKeyframe (arg0_date) {
			//Convert from parameters
			let date = Date.getDate(arg0_date);
			
			if (this.state.length === 0) return null; //Internal guard clause if there is nothing in the current state
			
			//Declare local instance variables
			let best_index = 0;
			let timestamp = date.getTime();
			
			let best_distance = Math.abs(this.state[0].date - timestamp);
			
			//Iterate over the current state and update best_dist, best_index
			for (let i = 1; i < this.state.length; i++) {
				let local_distance = Math.abs(this.state[i].date - timestamp);
				
				if (local_distance < best_distance) {
					best_distance = local_distance;
					best_index = i;
				}
			}
			
			if (this.draw) this.draw(); //Call draw() if it exists
			
			//Return statement
			return {
				data: this._resolveStateAtIndex(best_index),
				date: this.state[best_index].date,
				index: best_index
			};
		}
		
		/**
		 * Moves a keyframe from `arg0_date` to `arg1_date`.
		 * 
		 * @param {Date|any} arg0_date
		 * @param {Date|any} arg1_date
		 * 
		 * @returns {boolean}
		 */
		moveKeyframe (arg0_date, arg1_date) {
			//Convert from parameters
			let old_date = Date.getDate(arg0_date).getTime();
			let new_date = Date.getDate(arg1_date).getTime();
			
			//Declare local instance variables
			let index = this.state.findIndex((local_keyframe) => local_keyframe.date === old_date);
				if (index === -1) return false; //Internal guard clause if index could not be found
			
			//Resolve snapshot at the old position
			let snapshot = this._resolveStateAtIndex(index);
			this.deleteKeyframe(old_date);
			this.addKeyframe(new_date, snapshot);
			
			//Return statement
			return true;
		}
		
		/**
		 * Removes the Ontology.
		 */
		remove () {
			//Declare local instance variables
			let index = Ontology.instances.indexOf(this);
				if (index !== -1) Ontology.instances.splice(index, 1);
			let queue_index = Ontology.queue.indexOf(this);
				if (queue_index !== -1) Ontology.queue.splice(index, 1);
			
			//Remove geometries from any map layer
			for (let local_geometry of this.geometries)
				if (local_geometry && local_geometry.remove) local_geometry.remove();
			this.geometries = [];
			this.state = [];
		}
		
		/**
		 * Removes a single relation from a specified date.
		 * 
		 * @param {Object|string} arg0_relation
		 * @param {Date|any} arg1_date
		 */
		removeRelation (arg0_relation, arg1_date) {
			//Convert from parameters
			let relation_id = (typeof arg0_relation === "string") ? arg0_relation : arg0_relation?.id;
			let date = (arg1_date) ? Date.getDate(arg1_date).getTime() : Date.now();
			
			if (!relation_id) return; //Internal guard clause if relation_id doesn't exist
			
			//Declare local instance variables
			let current_state = this.getState(date);
			
			this.addKeyframe(date, current_state, { remove_relations: [relation_id] });
		}
		
		/**
		 * Removes multiple relations from a specified date.
		 * 
		 * @param {Object|string} arg0_relations
		 * @param {Date|any} arg1_date
		 */
		removeRelations (arg0_relations, arg1_date) {
			//Convert from parameters
			let relations = (arg0_relations) ? arg0_relations : [];
			let date = (arg1_date) ? Date.getDate(arg1_date).getTime() : Date.now();
			
			//Declare local instance variables
			let current_state = this.getState(date);
			let relation_ids = relations.map((r) => (typeof r === "string") ? r : r.id);
			
			this.addKeyframe(date, current_state, { remove_relations: relation_ids });
		}
		
		/**
		 * Applies relation/tag mutation fields onto a fully-resolved data object and returns the result (input is not mutated).
		 * 
		 * Order per category: set > add > remove.
		 * @alias #applyMutations
		 * @memberof Ontology
		 * 
		 * @param {Object} arg0_resolved_data
		 * @param {Object} arg1_mutations
		 * 
		 * @returns {Object}
		 */
		static applyMutations (arg0_resolved_data, arg1_mutations) {
			//Convert from parameters
			let data = structuredClone(arg0_resolved_data);
			let mutations = arg1_mutations;
			
			//Initialise data
			if (!data._relations) data._relations = [];
			if (!data._tags) data._tags = [];
			
			//Relations
			if (mutations.set_relations)
				data._relations = structuredClone(mutations.set_relations);
			if (mutations.add_relations)
				for (let local_relation of mutations.add_relations)
					if (!data._relations.find((r) => (r.id === local_relation.id)))
						data._relations.push(structuredClone(local_relation));
			if (mutations.remove_relations)
				for (let local_relation of mutations.remove_relations) {
					let relation_id = (typeof local_relation === "string") ? local_relation : local_relation.id;
					data._relations = data._relations.filter((r) => r.id !== relation_id);
				}
			
			//Tags
			if (mutations.set_tags)
				data._tags = [...mutations.set_tags];
			if (mutations.add_tags)
				for (let local_tag of mutations.add_tags)
					if (!data._tags.includes(local_tag)) data._tags.push(local_tag);
			if (mutations.remove_tags)
				data._tags = data._tags.filter((t) => !mutations.remove_tags.includes(t));
			
			//Return statement
			return data;
		}
		
		/**
		 * Returns an Ontology ID/hash reflective of the current date.
		 * 
		 * @alias #getOntologyID
		 * @memberof Ontology
		 * 
		 * @returns {string}
		 */
		static getOntologyID () {
			//Return statement
			return `${Date.now()}_${this.queue.length}`;
		}
		
		/**
		 * Initialises Ontology logic at the global level.
		 * 
		 * @alias #initialise
		 * @memberof Ontology
		 */
		static initialise () {
			Ontology.initialised = true;
			Ontology.logic_loop = setInterval(() => {
				for (let i = 0; i < Ontology.queue.length; i++)
					Ontology.instances.push(Ontology.queue[i]);
				Ontology.queue = [];
			}, 100);
		}
	};
}