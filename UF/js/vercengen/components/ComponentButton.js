/**
 * <span color = "yellow">{@link Class}</span>: ComponentButton
 *
 * ##### Instance:
 * - `.element`: {@link HTMLElement}
 * - `.options`: {@link Object}
 *   - `.icon`: {@link string} - The file path for the given button icon.
 *   - `.name`: {@link string}
 *
 * - - `.onclick`: function({@link ve.ComponentButtonOnclickEvent})
 *
 * ##### Methods:
 * - <span color=00ffff>{@link ve.ComponentButton.handleEvents|handleEvents}</span>
 *
 * @type {ve.ComponentButton}
 */
ve.ComponentButton = class {
	constructor (arg0_options) {
		//Convert from parameters
		this.options = (arg0_options) ? arg0_options : {};
		
		//Declare local instance variables
		this.element = document.createElement("span");
		var html_string = [];
		var options = this.options;
		
		//Format html_string
		this.element.setAttribute("class", "button");
		if (options.icon)
			html_string.push(`<img src = "${options.icon}">`);
		if (options.name)
			html_string.push(options.name);
		
		//Populate element and initialise handlers
		this.element.innerHTML = html_string.join("");
		this.handleEvents();
	}
	
	/**
	 * Extends {@link HTMLElement.prototype.onclick}
	 * - `.component`: this:{@link ve.ComponentButton}
	 * - `.element`: {@link HTMLElement}
	 * - `.interface`: {@link ve.Interface}
	 * - `.state`: {@link ve.Interface.getState}
	 *
	 * @typedef ve.ComponentButtonOnclickEvent
	 */
	
	/**
	 * Initialises event handlers for the present Component.
	 */
	handleEvents () {
		if (this.options.onclick)
			if (this.options.onclick == "string") {
				this.element.setAttribute("onclick", this.options.onclick);
			} else {
				this.element.onclick = (e) => {
					e.component = this;
					e.element = this.element;
					e.interface = this.options.parent;
					e.state = this.options.parent.getState();
					
					this.options.onclick(e);
				};
			}
	}
};