ve.Theme = class {
	constructor (arg0_theme_key, arg1_telestyle_obj) { //[WIP] - ve.Theme or Telestyle needs to be documented and tested
		//Convert from parameters
		let theme_key = arg0_theme_key;
		let telestyle_obj = (arg1_telestyle_obj) ? arg1_telestyle_obj : {};
		
		//Check if theme already exists in registry, if not, add it
		if (ve.registry.themes[theme_key]) {
			console.error(`Vercengen theme ${theme_key} already exists in registry as:`, ve.registry.themes[theme_key]);
		} else {
			ve.registry.themes[theme_key] = telestyle_obj;
		}
	}
};

//Functional binding

/**
 * @returns {ve.Theme}
 */
veTheme = function () {
	//Return statement
	return new ve.Theme(...arguments);
};