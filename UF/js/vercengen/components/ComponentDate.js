/**
 * <span color = "yellow">{@link ve.Date}</span>:ve.Date
 * 
 * ##### Constructor:
 * - `arg0_value`: {@link Object}
 *   - `.year`: {@link number}
 *   - `.month`: {@link number}
 *   - `.day`: {@link number}
 *   - `.hour`: {@link number}
 *   - `.minute`: {@link number}
 * - `arg1_options`: {@link Object}
 *   - `.attributes`: {@link Object}
 *     - `<attribute_key>`: {@link string}
 *   - `.name`: {@link string}
 *   - `.onchange`: {@link function}(this:{@link ve.Date})
 *   - `.style`: {@link Object}
 *     - `<style_key>`: {@link string}
 * 
 * ##### DOM:
 * - `.instance`: this:{@link ve.Date}
 * 
 * ##### Instance:
 * - `.element`: {@link HTMLElement}
 * - `.name`: {@link string}
 * - `.v`: {@link Object}
 *   - `.year`: {@link number}
 *   - `.month`: {@link number}
 *   - `.day`: {@link number}
 *   - `.hour`: {@link number}
 *   - `.minute`: {@link number}
 * 
 * ##### Methods:
 * - <span color=00ffff>{@link ve.Date.handleEvents|handleEvents}</span>()
 * - <span color=00ffff>{@link ve.Date.remove|remove}</span>()
 * 
 * @type {ve.Date}
 */
ve.Date = class veDate extends ve.Component {
	static demo_value = Date.getCurrentDate();
	
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : Date.getCurrentDate();
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
			this.element.setAttribute("component", "ve-date");
			this.element.instance = this;
		HTML.applyCSSStyle(this.element, options.style);
		
		this.value = Date.convertTimestampToDate(value);
		
		//Format html_string
		let attributes_string = HTML.objectToAttributes(attributes);
		let html_string = [];
		
		html_string.push(`<span id = "name"></span> `);
		html_string.push(`<input id = "day" class = "day-input" placeholder = "DD" size = "4"${attributes_string}>`);
		html_string.push(`<input id = "month" class = "month-input" list = "months" placeholder = "Month"${attributes_string}>`);
		html_string.push(`<datalist id = "months">`);
			Object.iterate(Date.months, (local_key, local_value) => {
				html_string.push(`<option value = "${local_value.name}">${local_value.month + 1}</option>`);
			});
		html_string.push(`</datalist>`);
		html_string.push(`<input id = "year" class = "year-input" placeholder = "YYYY"${attributes_string}>`);
		html_string.push(`<span id = "year-type">AD</span>`);
		
		html_string.push(`<input id = "hour" value = "00" placeholder = "HH" size = "2"${attributes_string}>:`);
		html_string.push(`<input id = "minute" value = "00" placeholder = "MM" size = "2"${attributes_string}>`);
		
		this.element.innerHTML = html_string.join("");
		
		//Handle inputs
		this.handleEvents();
		this.name = options.name;
		this.v = this.value;
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
		return Date.convertTimestampToDate(this.value);
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = (arg0_value) ? Date.convertTimestampToDate(arg0_value) : Date.getCurrentDate();
		
		//Declare local instance variables
		let year_type_el = this.element.querySelector(`#year-type`);
		
		//Set #year-type first
		if (value.year < 0) {
			year_type_el.innerHTML = "BC";
			value.year = Math.abs(value.year);
		} else {
			year_type_el.innerHTML = "AD";
		}
		
		//Set year, month, day, hour, minute
		this.element.querySelector("#year").value = value.year;
		this.element.querySelector("#month").value = Date.months[Date.all_months[value.month - 1]].name;
		this.element.querySelector("#day").value = value.day;
		
		this.element.querySelector(`#hour`).value = value.hour.toString().padStart(2, "0");
		this.element.querySelector(`#minute`).value = value.minute.toString().padStart(2, "0");
		
		//Set value
		this.value = value;
		if (this.options.onchange) this.options.onchange(this);
	}
	
	/**
	 * Handles input events for {@link ve.Date}. Local helper function, since inputs need to be constrained to valid dates to remain fluid.
	 * 
	 * @typedef ve.Date.handleEvents
	 */
	handleEvents () {
		this.element.querySelector(`#year`).addEventListener("change", (e) => {
			let actual_value = parseInt(e.target.value);
			let year_type_el = this.element.querySelector(`#year-type`);
			
			if (!isNaN(actual_value)) {
				if (actual_value < 0) {
					actual_value = Math.abs(actual_value);
					year_type_el.innerHTML = "BC";
				} else if (actual_value === 0) {
					actual_value = 1;
					year_type_el.innerHTML = "AD";
				} else {
					year_type_el.innerHTML = "AD";
				}
				
				e.target.value = actual_value;
				this.value.year = actual_value;
			}
		});
		this.element.querySelector(`#month`).addEventListener("change", (e) => {
			let actual_month = -1;
			
			if (!isNaN(parseInt(e.target.value))) {
				let local_month = Date.months[Date.all_months[parseInt(e.target.value)]];
				
				if (local_month)
					actual_month = local_month.month;
			} else {
				actual_month = Date.getMonth(e.target.value);
			}
			
			e.target.value = Date.months[Date.all_months[actual_month - 1]].name;
			this.value.month = actual_month;
		});
		this.element.querySelector(`#day`).addEventListener("change", (e) => { 
			let actual_value = parseInt(e.target.value);
			let current_month = Date.getMonth(this.element.querySelector(`#month`).value);
			let current_year = parseInt(this.element.querySelector(`#year`).value);
			
			if (!isNaN(actual_value) && current_month) {
				//Get days_in_month
				let days_in_month = current_month.days;
				if (Date.isLeapYear(current_year) && current_month.leap_year_days) 
					days_in_month = current_month.leap_year_days;
				
				if (actual_value < 1) actual_value = 1;
				if (actual_value > days_in_month) actual_value = days_in_month;
			} else {
				actual_value = 1;
			}
			
			e.target.value = actual_value;
			this.value.day = actual_value;
		});
		
		this.element.querySelector(`#hour`).addEventListener("change", (e) => {
			let actual_value = parseInt(e.target.value);
			
			if (!isNaN(actual_value)) {
				if (actual_value > 23) actual_value = 23;
				if (actual_value < 0) actual_value = 0;
			} else {
				actual_value = 0;
			}
			
			e.target.value = actual_value.toString().padStart(2, "0");
			this.value.hour = actual_value;
		});
		this.element.querySelector(`#minute`).addEventListener("change", (e) => {
			let actual_value = parseInt(e.target.value);
			
			if (!isNaN(actual_value)) {
				if (actual_value > 59) actual_value = 59;
				if (actual_value < 0) actual_value = 0;
			} else {
				actual_value = 0;
			}
			
			e.target.value = actual_value.toString().padStart(2, "0");
			this.value.minute = actual_value;
		});
	}
	
	/**
	 * Removes the component/element from the DOM.
	 *
	 * @typedef ve.Date.remove
	 */
	remove () {
		this.element.remove();
	}
};