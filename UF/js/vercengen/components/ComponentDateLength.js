ve.DateLength = class veDateLength extends ve.Component {
	static demo_value = { year: 1000, month: 12, day: 31 };
	
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		
		//Declare local instance variables
		let attributes = {
			readonly: options.disabled,
			...options.attributes
		};
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-datelength");
			this.element.instance = this;
		HTML.applyCSSStyle(this.element, options.style);
		
		this.value = value;
		
		//Format HTML string
		let attributes_string = HTML.objectToAttributes(attributes);
		let html_string = [];
		html_string.push(`<span id = "name"></span> `);
		html_string.push(`
			<div class = "date-container">
				<input id = "years" size = "6" type = "number" placeholder = "Years"${attributes_string}>
				<input id = "months" size = "6" type = "number" min = "1" max = "12" placeholder = "Months"${attributes_string}>
				<input id = "days" size = "5" type = "number" placeholder = "Days"${attributes_string}>
			</div>
			<div class = "clock-container">
				<input id = "hours" size = "2" min = "0" max = "23" type = "number" placeholder = "HH"${attributes_string}> :
				<input id = "minutes" size = "2" min = "0" max = "23" type = "number" placeholder = "MM"${attributes_string}>
			</div>
		`);
		
		//Populate element and initialise handlers
		this.element.innerHTML = html_string.join("");
		this.v = value;
	}
	
	get name () {
		//Return statement
		return this.element.querySelector(`#name`).innerHTML;
	}
	
	set name (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
		
		//Set name
		this.element.querySelector(`#name`).innerHTML = (value) ? value : "";
	}
	
	get v () {
		//Return statement
		return Date.convertTimestampToDate(Date.getTimestamp({
			year: parseInt(this.element.querySelector(`#years`).value),
			month: parseInt(this.element.querySelector(`#months`).value),
			day: parseInt(this.element.querySelector(`#days`).value),
			hour: parseInt(this.element.querySelector(`#hours`).value),
			minute: parseInt(this.element.querySelector(`#minutes`).value)
		}));
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
		
		//Declare local instance variables
		this.element.querySelector(`#years`).value = Math.returnSafeNumber(value.year);
		this.element.querySelector(`#months`).value = Math.returnSafeNumber(value.month)
		this.element.querySelector(`#days`).value = Math.returnSafeNumber(value.day);
		this.element.querySelector(`#hours`).value = Math.returnSafeNumber(value.hour);
		this.element.querySelector(`#minutes`).value = Math.returnSafeNumber(value.minute);
		if (this.options.onchange) this.options.onchange(this.value);
	}
	
	remove () {
		this.element.remove();
	}
}