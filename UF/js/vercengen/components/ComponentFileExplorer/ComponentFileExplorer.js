ve.FileExplorer = class extends ve.Component {
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : __dirname;
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		options.file_components_obj = (options.file_components_obj) ? options.file_components_obj : {
			copy: new ve.Button((e) => {}, {
				name: `<icon>content_copy</icon>`,
				tooltip: "Copy"
			}),
			move: new ve.Button((e) => {}, {
				name: `<icon>subdirectory_arrow_right</icon>`,
				tooltip: "Move"
			}),
			delete_forever: new ve.Button((e) => {}, {
				name: `<icon>delete</icon>`,
				tooltip: "Delete"
			}),
		};
		options.file_icon = (options.file_icon) ? options.file_icon : "<icon>description</icon>";
		options.file_options = (options.file_options) ? options.file_options : {};
		options.folder_components_obj = (options.folder_components_obj) ? options.folder_components_obj : {
			copy: new ve.Button((e) => {}, { 
				name: `<icon>content_copy</icon>`,
				tooltip: "Copy"
			}),
			move: new ve.Button((e) => {}, {
				name: `<icon>subdirectory_arrow_right</icon>`,
				tooltip: "Move"
			}),
			delete_forever: new ve.Button((e) => {}, {
				name: `<icon>delete</icon>`,
				tooltip: "Delete"
			}),
		};
		options.folder_icon = (options.folder_icon) ? options.folder_icon : "<icon>folder</icon>";
		options.folder_options = (options.folder_options) ? options.folder_options : {};
		
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-file-explorer");
			Object.iterate(options.attributes, (local_key, local_value) => {
				this.element.setAttribute(local_key, local_value.toString());
			});
			this.element.instance = this;
		HTML.applyCSSStyle(this.element, options.style);
			
		//Format html_string
		let html_string = [];
		
		html_string.push(`<span id = "name"></span>`);
		html_string.push(`<div id = "file-explorer-body"></div>`);
		this.element.innerHTML = html_string.join("");
		
		//Refresh file explorer display
		this.options = options;
		this.name = options.name;
		this.value = value;
		this.refresh();
	}
	
	get name () {
		//Return statement
		this.element.querySelector("#name").innerHTML;
	}
	
	set name (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
		
		//Set name
		this.element.querySelector(`#name`).innerHTML = (value) ? value : "";
	}
	
	/**
	 * Refreshes the current file explorer path, rerendering the display for folders and files within the Component.
	 * - Method of: {@link ve.FileExplorer}
	 */
	refresh () {
		//Declare local instance variables
		let all_files_in_directory = fs.readdirSync(this.value, { withFileTypes: true });
		let hierarchy_obj = {};
		
		//Add item button to move up one folder at the top
		let previous_folder_path = path.join(this.value, "..");
		hierarchy_obj[previous_folder_path] = new ve.HierarchyDatatype({
			up_icon: new ve.HTML(`<icon>subdirectory_arrow_left</icon>`, { style: { padding: 0 }}),
			two_dots: new ve.HTML(`Back`)
		}, {
			disabled: true
		});
		
		let previous_folder_obj = hierarchy_obj[previous_folder_path];
		previous_folder_obj.element.onclick = (e) => {
			this.v = previous_folder_path;
		};
		
		//Iterate over all files and folders in the current directory
		for (let i = 0; i < all_files_in_directory.length; i++) {
			let local_full_path = path.join(this.value, all_files_in_directory[i].name);
			
			//Check to make sure local_full_path is a directory
			if (all_files_in_directory[i].isDirectory()) {
				hierarchy_obj[local_full_path] = new ve.HierarchyDatatype(
					{ 
						folder_icon: new ve.HTML(this.options.folder_icon, {
							style: { padding: 0 }
						}),
						actions_menu: new ve.RawInterface({
							...Object.fromEntries(
								Object.entries(this.options.folder_components_obj).map(([local_key, local_component]) => {
									return [local_key, local_component.clone ? 
										local_component.clone() : 
										new local_component.constructor(local_component.value, local_component.options)];
								})
							)
						}, {
							style: {
								marginLeft: "auto",
								order: 99,
								padding: 0
							},
							...this.options.folder_options
						}),
						/*actions_menu: new ve.HTML("Actions Menu", {
							onload: (e) => {
								new ve.Tooltip("<b>Test</b>", { element: e.element });
							},
							style: { order: 99, marginLeft: "auto" }
						}),*/
					}, { 
						attributes: {
							"data-folder": true
						},
						name: all_files_in_directory[i].name,
						disabled: true,
						...this.options.folder_options 
					}
				);
				
				//Add onclick event handler to hierarchy_obj[local_full_path] since we need navigation to work into a folder
				let local_folder_obj = hierarchy_obj[local_full_path];
				local_folder_obj.element.onclick = (e) => {
					if (!e.target.closest(`button, input, .tippy-arrow, .tippy-box, .tippy-content`))
						this.v = local_full_path;
				};
			}
		}
		for (let i = 0; i < all_files_in_directory.length; i++) {
			let local_full_path = path.join(this.value, all_files_in_directory[i].name);
			
			//Check to make sure local_full_path is a directory is a file
			if (all_files_in_directory[i].isFile()) {
				hierarchy_obj[local_full_path] = new ve.HierarchyDatatype(
					{
						file_icon: new ve.HTML(this.options.file_icon, {
							style: { opacity: 0.6, padding: 0 }
						}),
						actions_menu: new ve.RawInterface({
							...Object.fromEntries(
								Object.entries(this.options.file_components_obj).map(([local_key, local_component]) => {
									return [local_key, local_component.clone ?
										local_component.clone() :
										new local_component.constructor(local_component.value, local_component.options)];
								})
							)
						}, {
							style: {
								marginLeft: "auto",
								order: 99,
								padding: 0
							},
							...this.options.folder_options
						})
					}, {
						attributes: {
							"data-file": true
						},
						name: all_files_in_directory[i].name,
						disabled: true,
						...this.options.file_options
					}
				);
			}
		}
		
		//Set hierarchy depending on whether it already exists or not
		let file_explorer_el = this.element.querySelector(`#file-explorer-body`);
		
		this.hierarchy = new ve.Hierarchy(hierarchy_obj);
		file_explorer_el.innerHTML = "";
		file_explorer_el.appendChild(this.hierarchy.element);
	}
	
	remove () {
		this.element.remove();
	}
	
	get v () {
		//Return statement
		return this.value;
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
		
		//Set new folder path before refreshing display
		this.value = value;
		this.refresh();
	}
};