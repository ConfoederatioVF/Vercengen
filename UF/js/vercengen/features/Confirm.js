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
				yes_button: new ve.Button((e, v) => {
					if (this.options.special_function)
						this.options.special_function(e, v);
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
	
	close () {
		if (this.modal)
			this.modal.close();
	}
};