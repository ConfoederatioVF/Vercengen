//Initialise functions
if (!global.DALS) global.DALS = {};

/**
 * Loads the given state. Refreshed upon undo/redo.
 * @param {Object} arg0_state
 */
DALS.loadState = function (arg0_state) {
	//Convert from parameters
	let state_obj = arg0_state;
	
	console.log(`state_obj:`, state_obj);
	throw new Error("DALS.loadState() has not been overridden by the app. It cannot deserialise any data, or load individual states.");
};