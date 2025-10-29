/**
 * Refer to <span color = "yellow">{@link ve.Feature}</span> for methods or fields inherited from the parent, such as automatic destructuring.
 * 
 * Confirmation prompt used for executing a `.options.special_function` call.
 * - Functional binding: <span color=00ffff>veConfirm</span>().
 * - Inherits Feature: {@link ve.Modal}
 * 
 * ##### Constructor:
 * - `arg0_components_obj`: {@link function}|{@link Object}<{@link ve.Component}>|{@link string}|{@link ve.Component}
 * - `arg1_options`: {@link Object} - Superset of `.options` for {@link ve.Modal}.
 *   - `.special_function`: {@link function}(v:{@link function}, e:{@link ve.Button})
 * 
 * ##### Methods::
 * - <span color=00ffff>{@link ve.Confirm.close|close}</span>()
 * 
 * @augments {@link ve.Feature}
 * @type {ve.Confirm}
 */
ve.Confirm = class extends ve.Feature {
	constructor (arg0_components_obj, arg1_options) {
		//Convert from parameters
		let components_obj = arg0_components_obj;
		let options = (arg1_options) ? arg1_options : {};
			super(components_obj, options);
		
		//Declare local instance variables: this.modal
		this.components_obj = components_obj;
		this.options = options;
		
		if (typeof this.components_obj === "function" || typeof this.components_obj === "string")
			this.components_obj = {
				html: new ve.HTML(this.components_obj)
			};
		this.components_obj = { 
			...this.components_obj,
			confirm_bar: new ve.RawInterface({
				yes_button: new ve.Button((v, e) => {
					if (this.options.special_function)
						this.options.special_function(v, e);
				}, { name: "Yes" }),
				no_button: new ve.Button(() => this.close(), { name: "No" })
			}, { name: " ", style: { display: "flex" } })
		};
		
		this.modal = new ve.Modal(this.components_obj, {
			name: "Confirm",
			draggable: true,
			resizable: true,
			width: "24rem",
			...this.options
		});
	}
	
	/**
	 * Closes the present {@link ve.Confirm} feature.
	 * - Method of: {@link ve.Confirm}
	 */
	close () {
		if (this.modal)
			this.modal.close();
	}
};

//Functional binding

/**
 * @returns {ve.Confirm}
 */
veConfirm = function () {
	//Return statement
	return new ve.Confirm(...arguments);
};