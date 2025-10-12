//Initialise functions
{
	String.formatNumber = function (arg0_number, arg1_places) {
		//Convert from parameters
		let number = parseFloat(arg0_number);
		let places = Math.returnSafeNumber(arg1_places, 0);
		
		//Round to sigfigs first
		number = Math.roundNumber(number, places);
		
		//Return statement
		return new Intl.NumberFormat("de-DE").format(number);
	};
	
	String.prototype.isURL = function () {
		//Return statement
		try {
			new URL(this);
			return true;
		} catch (e) {
			return false;
		}
	};
}