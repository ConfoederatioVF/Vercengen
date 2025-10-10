//Initialise functions
{
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