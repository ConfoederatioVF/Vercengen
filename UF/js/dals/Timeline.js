//Initialise class
if (!global.DALS) global.DALS = {};
if (!global.main) global.main = {};

DALS.Timeline = class {
	//Declare local static variables
	static current_timeline;
	static instances = [];
	
	//Constructor/getter/setter
	constructor (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Declare local instance variables
		if (DALS.Timeline.instances.length === 0)
			this.initial_timeline = true;
		
		this.id = Class.generateRandomID(DALS.Timeline);
		this.setName(options.name);
		this.parent_timeline = options.parent_timeline;
		this.value = [structuredClone(global.main)];
		
		//Ensure that the current timeline is always the last timeline created/split off
		if (options.current_timeline !== false)
			DALS.Timeline.current_timeline = this;
		DALS.Timeline.instances.push(this);
	}
	
	get () {
		return this.value;
	}
	
	set (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Interpret options
		if (Array.isArray(options)) {
			this.value = options;
		} else {
			if (options.id) this.id = options.id;
			if (options.parent_timeline) this.parent_timeline = options.parent_timeline;
			
			if (options.actions) this.value = options.actions;
			if (options.value) this.value = options.value;
		}
	}
	
	//Class methods
	addAction (arg0_action_obj) {
		//Convert from parameters
		let action_obj = arg0_action_obj;
		
		//Internal guard clause if action_obj is not of type DALS.Action
		if (action_obj.constructor.name !== "Action")
			throw new Error(`arg0_action_obj is not of type DALS.Action.`);
		
		//Declare local instance variables
		action_obj.timeline = this;
		
		//Push action_obj to current timeline
		this.value.push(action_obj);
	}
	
	branchTimeline (arg0_options) {
		//Convert from parameters
		let options = (arg0_options) ? arg0_options : {};
		
		//Initialise options
		options.parent_timeline = this;
		
		//Return statement
		return new DALS.Timeline(options);
	}
	
	delete () {
		//Iterate over all actions in the current timeline and remove them
		for (let i = 1; i < this.value.length; i++)
			this.value[i].delete({ removed_from_timeline: true });
		this.value = [];
		
		//Iterate over DALS.Timeline.instances; delete from DALS.Timeline.instances
		for (let i = 0; i < DALS.Timeline.instances.length; i++)
			if (DALS.Timeline.instances[i].id === this.id) {
				DALS.Timeline.instances.splice(i, 1);
				break;
			}
	}
	
	static getTimeline (arg0_timeline_id) {
		//Convert from parameters
		let timeline_id = arg0_timeline_id;
		
		//Internal guard clause if timeline_id is of type object
		if (typeof timeline_id === "object") return timeline_id;
		
		//Iterate over all .instances otherwise and return if the timeline ID is a match
		for (let i = 0; i < DALS.Timeline.instances.length; i++)
			if (DALS.Timeline.instances[i].id === timeline_id)
				//Return statement
				return DALS.Timeline.instances[i];
	}
	
	getName () {
		//Return statement
		return (this.name) ? this.name : "";
	}
	
	jumpToAction (arg0_action_id) {
		//Convert from parameters
		let action_id = arg0_action_id;
		
		//Load initial state if possible
		DALS.loadState(this.value[0]);
		
		//Continue redoing actions starting from the cached state until we hit the target ID
		for (let i = 1; i < this.value.length; i++) {
			if (this.value[i].redo_function)
				this.value[i].redo_function();
			if (this.value[i].id === action_id) break; //Break once we have hit the target ID
		}
	}
	
	jumpToEnd () {
		if (this.value.length > 1) {
			this.jumpToAction(this.value[this.value.length - 1].id);
		} else {
			this.jumpToStart(); //Load the initial state since we have no actions cached
		}
	}
	
	jumpToStart () {
		//Load initial state
		DALS.loadState(this.value[0]);
	}
		//Register aliases
		jumpTo () {
			this.jumpToStart();
		}
	
	static jumpToTimeline (arg0_timeline_id) {
		//Convert from parameters
		let timeline_id = arg0_timeline_id;
		
		//jumpToStart of target timeline
		DALS.Timeline.getTimeline(timeline_id).jumpTo();
	}
	
	setName (arg0_timeline_name) {
		//Convert from parameters
		let timeline_name = arg0_timeline_name;
		
		//Declare local instance variables
		this.name = (timeline_name) ? timeline_name : `Timeline ${this.id}`;
	}
	
	removeAction (arg0_action_obj) {
		//Convert from parameters
		let action_obj = arg0_action_obj;
		
		//Iterate over all items in this.value
		for (let i = 1; i < this.value.length; i++)
			if (action_obj && action_obj.id === this.value[i].id)
				this.value.splice(i, 1);
	}
};