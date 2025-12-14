ve.SearchSelect = class extends ve.Component {
	static reserved_keys = ["element", "id", "name"];
	
	constructor (arg0_components_obj, arg1_options) {
		//Convert from parameters
		let components_obj = (arg0_components_obj) ? arg0_components_obj : {};
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		
		//Declare local instance variables
		this.element = document.createElement("div");
		this.element.setAttribute("component", "ve-search-select");
		Object.iterate(options.attributes, (local_key, local_value) => 
			this.element.setAttribute(local_key, local_value.toString()));
		this.options = options;
		
		//Append components_obj to this.element
		this.v = components_obj;
	}
	
	get v () {
		//Return statement
		return this.components_obj;
	}
	
	set v (arg0_components_obj) {
		//Convert from parameters
		let components_obj = arg0_components_obj;
		
		//Reset element; re-append all components in components_obj to element as though it were a ve.RawInterface
		this.components_obj = components_obj;
		this.element.innerHTML = "";
		let searchbar_interface = new ve.RawInterface({
			searchbar_icon: new ve.HTML("<icon>search</icon>", { style: { padding: `var(--cell-padding)` } }),
			searchbar_input: new ve.Datalist({}, {
				attributes: {
					placeholder: loc("ve.registry.localisation.Hierarchy_search_for_item")
				},
				name: " ",
				onuserchange: (v) => {
					
				}
			}),
			searchbar_filter: new ve.Button(() => {
				//Add checkbox context menu based on data- attributes
			}, { name: "<icon>filter</icon>" })
		}, {
			name: " ",
			style: {
				...ve.theme["ve-searchbar"],
				...this.options.searchbar_style
			}
		});
		searchbar_interface.bind(this.element);
		
		Object.iterate(this.components_obj, (local_key, local_value) =>
			this.element.appendChild(local_value.element));
	}
};