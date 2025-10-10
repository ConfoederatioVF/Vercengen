//Initialise class
if (!global.DALS) global.DALS = {};

DALS.Action = class {
	//Declare local static variables
	static instances = [];
	
	//Constructor/getter/setter
	constructor (arg0_redo_function, arg1_options) {
		//Convert from parameters
		let redo_function = arg0_redo_function;
		let options = (arg1_options) ? arg1_options : {};
		
		//Internal guard clauses
		if (typeof redo_function !== "function")
			throw new Error(`arg0_redo_function must be of type 'function' for DALS.Action.`);
		
		//Declare local instance variables
		this.id = Class.generateRandomID(DALS.Action);
		this.redo_function = redo_function;
		this.timeline = undefined; //Populated upon .addAction()
		
		//Assign Action to DALS.Timeline
		if (!options.timeline) {
			//Assign to current_timeline
			DALS.Timeline.current_timeline.addAction(this);
		} else {
			//Assign to specified timeline
			DALS.Timeline.getTimeline(options.timeline)
				.addAction(this);
		}
		
		DALS.Action.instances.push(this);
	}
	
	//Class methods
	delete (arg0_options) {
		//Declare local instance variables
		let options = (arg0_options) ? arg0_options : {
			removed_from_timeline: false
		};
		
		//Iterate over DALS.Action.instances; delete rom DALS.Action.instances
		for (let i = 0; i < DALS.Action.instances.length; i++)
			if (DALS.Action.instances[i] === this) {
				DALS.Action.instances.splice(i, 1);
				break;
			}
		if (!options.removed_from_timeline)
			if (this.timeline)
				this.timeline.removeAction(this);
	}
	
	jumpTo () {
		this.timeline.jumpToAction(this.id);
	}
};