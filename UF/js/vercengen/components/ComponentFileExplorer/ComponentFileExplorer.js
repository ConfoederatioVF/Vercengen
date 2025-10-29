/**
 * Refer to <span color = "yellow">{@link ve.Component}</span> for methods or fields inherited from this Component's parent such as `.options.attributes` or `.element`.
 * 
 * File explorer used either for navigation (i.e. saving/loading) or as a generic file explorer primitive.
 * - Functional binding: <span color=00ffff>veFileExplorer</span>().
 * 
 * ##### Constructor:
 * - `arg0_value`: {@link string} - The file path in which the FileExplorer should be initialised.
 * - `arg1_options`: {@link Object}
 *   - `.file_components_obj={select: ...}`: {@link Object}<{@link ve.Component}>
 *   - `.file_icon="<icon>description</icon>"`: {@link string}
 *   - `.file_options`: {@link Object}
 *   - `.folder_components_obj={select: ...}`: {@link Object}<{@link ve.Component}>
 *   - `.folder_icon="<icon>folder</icon>"`: {@link string}
 *   - `.folder_options`: {@link Object}
 *   - `.name`: {@link string}
 *   - `.navigation_only=false`: {@link boolean}
 *   
 * ##### Instance:
 * - `.clipboard`: {@link Array}<{@link string}> - The list of full file paths currently stored in the clipboard.
 * - `.selected`: {@link Array}<{@link string}> - The list of selected file paths.
 * - `.v`: {@link string} - Accessor. The current file path.
 * 
 * ##### Methods:
 * - <span color=00ffff>{@link ve.FileExplorer.clearClipboard|clearClipboard}</span>()
 * - <span color=00ffff>{@link ve.FileExplorer.deselect|deselect}</span>(arg0_file_path:{@link string}, arg1_options:{do_not_modify_classes: {@link boolean}}) | {@link Array}<{@link string}>
 * - <span color=00ffff>{@link ve.FileExplorer.deselectAll|deselectAll}</span>()
 * - <span color=00ffff>{@link ve.FileExplorer.fireSelectToggle|fireSelectToggle}(v:{@link boolean}, e:{@link ve.Toggle}) - Internal handler for toggling file/folder selection.
 * - <span color=00ffff>{@link ve.FileExplorer.select|select}</span>(arg0_file_path:{@link string}) | {@link Array}<{@link string}>
 * - <span color=00ffff>{@link ve.FileExplorer.selectAll|selectAll}</span>()
 * - <span color=00ffff>{@link ve.FileExplorer.setClipboard|setClipboard}</span>() - Sets the clipboard to currently selected file paths.
 * - <span color=00ffff>{@link ve.FileExplorer.refresh|refresh}</span>() - Refreshes the current ve.FileExplorer display. Handled automatically.
 *
 * @augments {@link ve.Component}
 * @type {ve.FileExplorer}
 */
ve.FileExplorer = class extends ve.Component {
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : __dirname;
		let options = (arg1_options) ? arg1_options : {};
			super(options);
			
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		options.file_components_obj = (options.file_components_obj) ? options.file_components_obj : {
			select: new ve.Toggle(false, {
				off_name: `<icon>check_box_outline_blank</icon>`,
				on_name: `<icon>check_box</icon>`,
				onchange: (v, e) => this.fireSelectToggle(v, e),
				tooltip: "Select"
			})
		};
		options.file_icon = (options.file_icon) ? options.file_icon : "<icon>description</icon>";
		options.file_options = (options.file_options) ? options.file_options : {};
		options.folder_components_obj = (options.folder_components_obj) ? options.folder_components_obj : {
			select: new ve.Toggle(false, {
				off_name: `<icon>check_box_outline_blank</icon>`,
				on_name: `<icon>indeterminate_check_box</icon>`,
				onchange: (v, e) => this.fireSelectToggle(v, e),
				tooltip: "Select"
			})
		};
		options.folder_icon = (options.folder_icon) ? options.folder_icon : "<icon>folder</icon>";
		options.folder_options = (options.folder_options) ? options.folder_options : {};
		options.name = (options.name) ? options.name : "";
		
		//options.navigation_only override
		if (options.navigation_only)
			options = {
				...options,
				disable_actions: true,
				file_components_obj: {},
				folder_components_obj: {},
				onload: (e) => e.name = ""
			};
		
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-file-explorer");
			Object.iterate(options.attributes, (local_key, local_value) => {
				this.element.setAttribute(local_key, local_value.toString());
			});
			this.element.instance = this;
		HTML.applyTelestyle(this.element, options.style);
			
		//Format html_string
		let html_string = [];
		
		html_string.push(`<span id = "name"></span>`);
		html_string.push(`<div id = "file-explorer-body"></div>`);
		this.element.innerHTML = html_string.join("");
		
		/**
		 * Contains all file paths currently in the clipboard.
		 * - Field of: {@link ve.FileExplorer}
		 * @type {string[]}
		 */
		this.clipboard = []; //Array<String> containing file paths currently in clipboard
		
		/**
		 * Contains all currently selected file paths.
		 * - Field of: {@link ve.FileExplorer}
		 * @type {string[]}
		 */
		this.selected = []; //Array<String> containing file paths that are currently selected
		
		//Refresh file explorer display
		this.options = options;
		this.name = this.options.name;
		this.value = value;
		this.refresh();
	}
	
	/**
	 * Returns the present file path.
	 * - Accessor of {@link ve.FileExplorer} 
	 * 
	 * @returns {string}
	 */
	get v () {
		//Return statement
		return this.value;
	}
	
	/**
	 * Sets the present file path.
	 * - Accessor of {@link ve.FileExplorer}
	 * 
	 * @param {string} arg0_value
	 */
	set v (arg0_value) {
		//Convert from parameters
		let value = arg0_value;
		
		//Set new folder path before refreshing display
		this.deselectAll();
		this.value = value;
		this.refresh();
		this.fireFromBinding();
	}
	
	/**
	 * Clears the present keyboard.
	 * - Method of {@link ve.FileExplorer}
	 */
	clearClipboard () {
		this.clipboard = [];
	}
	
	/**
	 * Deselects a specific file path and removes it from {@link this.selected}.
	 * - Method of {@link ve.FileExplorer} 
	 * 
	 * @param {string} arg0_file_path
	 * @param {Object} [arg1_options]
	 *  @param {boolean} [arg1_options.do_not_modify_classes=false]
	 * 
	 * @returns string[]
	 */
	deselect (arg0_file_path, arg1_options) {
		//Convert from parameters
		let file_path = arg0_file_path;
		let options = (arg1_options) ? arg1_options : {};
		
		//Iterate over all this.selected and splice
		for (let i = 0; i < this.selected.length; i++)
			if (this.selected[i] === file_path) {
				//Try to find the element in question and remove .selected
				if (!options.do_not_modify_classes)
					Object.iterate(this.hierarchy.components_obj, (local_key, local_value) => {
						if (local_key === file_path)
							local_value.element.classList.remove("selected");
					});
				this.selected.splice(i, 1);
			}
		
		//Return statement
		return this.selected;
	}
	
	/**
	 * Deselects all file paths, clearing {@link this.selected}.
	 * - Method of {@link ve.FileExplorer}
	 */
	deselectAll () {
		//Iterate over all this.selected and deselect them
		for (let i = this.selected.length - 1; i >= 0; i--)
			this.deselect(this.selected[i], { do_not_modify_classes: true });
		//Iterate over all this.hierarchy.components_obj and update their classes to be deselected
		Object.iterate(this.hierarchy.components_obj, (local_key, local_value) => {
			local_value.element.classList.remove("selected");
		});
	}
	
	fireSelectToggle (v, e) {
		if (e.owners)
			for (let i = e.owners.length - 1; i >= 0; i--)
				if (e.owners[i] instanceof ve.HierarchyDatatype) try {
					let full_path = e.owners[i].element.getAttribute("data-path");
					(v) ? this.select(full_path) : this.deselect(full_path);
					break;
				} catch (e) { console.error(e); }
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
		
		hierarchy_obj.file_path = new ve.HierarchyDatatype({
			information: new ve.HTML(() => this.v)
		}, { disabled: true });
		if (!this.options.disable_actions)
			hierarchy_obj.selection = new ve.HierarchyDatatype({
				information: new ve.HTML((e) => `${(this.clipboard.length > 0) ? `Clipboard (${String.formatNumber(this.clipboard.length)})` : "Clipboard is empty."} &nbsp; | &nbsp; ${(this.selected.length > 0) ? `
				${String.formatNumber(this.selected.length)} Element(s) selected &nbsp; ` : ""}
				`, { style: { padding: 0 }}),
				actions_menu: new ve.RawInterface({
					copy_button: new ve.Button((e) => {
						if (this.selected.length === 0) return; //Internal guard clause if nothing is selected
						this.setClipboard();
						new ve.Toast(`Copied ${String.formatNumber(this.clipboard.length)} elements to clipboard.`);
					}, { name: "<icon>copy</icon>", limit: () => this.selected.length, tooltip: "Copy Selected" }),
					cut_button: new ve.Button((e) => {
						//This has to use a new file explorer in a modal with .options.disable_actions=true, since it would be fatal otherwise
						if (this.selected.length === 0) return; //Internal guard clause if nothing is selected
						
						//Declare local instance variables
						let modal = new ve.Modal({
							file_explorer: new ve.FileExplorer(this.v, { navigation_only: true }),
							confirm_button: new ve.Button((e) => {
								modal.close();
								ve.FileExplorer_move(this.selected, modal.components_obj.file_explorer.v, () => {
									this.refresh();
									this.deselectAll();
								});
							}, { name: "Confirm" })
						}, { name: `Cut/Paste ${String.formatNumber(this.selected.length)} files`, draggable: true, resizeable: true, width: "24rem" });
					}, { name: "<icon>cut</icon>", limit: () => this.selected.length, tooltip: "Cut Selected" }),
					paste_button: new ve.Button((e) => {
						let confirm = new ve.Confirm(`Are you sure you want to copy/paste ${String.formatNumber(this.clipboard.length)} file(s) to ${this.v}?`, {
							name: `Paste ${String.formatNumber(this.clipboard.length)} files`,
							special_function: () => {
								confirm.close();
								ve.FileExplorer_copy(this.clipboard, this.v, () => this.refresh());
							}
						});
					}, { name: "<icon>paste</icon>", limit: () => this.clipboard.length, tooltip: "Paste Clipboard" }),
					
					//clear_clipboard
					clear_clipboard: new ve.Button((e) => {
						this.clipboard = [];
					}, { name: "<icon>content_paste_off</icon>", limit: () => this.clipboard.length, tooltip: "Clear Clipboard" }),
					
					//move_button, delete_button
					move_button: new ve.Button((e) => {
						let modal = new ve.Modal({
							file_explorer: new ve.FileExplorer(this.v, { navigation_only: true }),
							confirm_button: new ve.Button((e) => {
								modal.close();
								ve.FileExplorer_move(this.selected, modal.components_obj.file_explorer.v, () => {
									this.refresh();
									this.deselectAll();
								});
							}, { name: "Confirm" })
						}, { name: `Move ${String.formatNumber(this.selected.length)} files`, draggable: true, resizeable: true, width: "24rem" });
					}, { name: "<icon>arrow_forward</icon>", limit: () => this.selected.length, tooltip: "Move Selected" }),
					delete_button: new ve.Button((e) => {
						let confirm = new ve.Confirm(`Are you sure you want to delete the following files?<br><br>${this.selected.join(", ")}<br><br>This action cannot be undone!`, {
							name: `Delete ${String.formatNumber(this.selected.length)} files`,
							special_function: () => {
								confirm.close();
								ve.FileExplorer_delete(this.selected, () => this.refresh());
							}
						});
					}, { name: "<icon>delete</icon>", limit: () => this.selected.length, tooltip: "Delete Selected" }),
					
					new_folder_button: new ve.Button((e) => {
						let local_modal = new ve.Window({
							html: new ve.HTML(`Create a new folder:`),
							new_folder_name: new ve.Text("",  { name: " " }),
							confirm_button: new ve.Button((e) => {
								let new_folder_path = path.join(this.v, local_modal.components_obj.new_folder_name.v);
								
								if (local_modal.components_obj.new_folder_name.v.length > 0) {
									fs.mkdirSync(new_folder_path, { recursive: true });
									this.refresh();
								} else {
									new ve.Toast(`You cannot create a folder with no name.`);
								}
							})
						}, { name: "Create New Folder" })
					}, { name: "<icon>create_new_folder</icon>", tooltip: "Create New Folder" })
				}, {
					style: { marginLeft: "auto", order: 99, padding: 0 }
				}),
			}, {
				attributes: { "data-ve-is-information": true },
				disabled: true
			});
		hierarchy_obj[previous_folder_path] = new ve.HierarchyDatatype({
			up_icon: new ve.HTML(`<icon>subdirectory_arrow_left</icon>`, { style: { padding: 0 }}),
			two_dots: new ve.HTML(`Back`)
		}, { disabled: true, limit: () => !File.isDrive(this.v) });
		
		let previous_folder_obj = hierarchy_obj[previous_folder_path];
		previous_folder_obj.element.ondblclick = (e) => {
			this.v = previous_folder_path;
			this.fireToBinding();
		};
		
		//Special handling for drive switching
		if (File.isDrive(this.v)) {
			let all_drives = File.getAllDrives();
			
			for (let i = 0; i < all_drives.length; i++) {
				if (path.resolve(this.v) === path.resolve(all_drives[i])) continue; //Internal guard clause if paths are the same
				hierarchy_obj[all_drives[i]] = new ve.HierarchyDatatype({
					drive_icon: new ve.HTML(`<icon>storage</icon>`, { style: { padding: 0 } } )
				}, {
					attributes: {
						"data-folder": true,
						"data-path": all_drives[i]
					},
					name: all_drives[i],
					disabled: true
				});
				hierarchy_obj[all_drives[i]].element.ondblclick = () => {
					this.v = all_drives[i];
					this.fireToBinding();
				};
			}
		}
		
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
							rename: new ve.Button((e) => {
								ve.FileExplorer_rename(local_full_path, () => this.refresh());
							}, {
								name: `<icon>drive_file_rename_outline</icon>`,
								tooltip: "Rename",
								style: { padding: `var(--cell-padding)` }
							}),
							...Object.fromEntries(
								Object.entries(this.options.folder_components_obj).map(([local_key, local_component]) => {
									return [local_key, local_component.clone ?
										local_component.clone() :
										new local_component.constructor(local_component.value, local_component.options)];
								})
							)
						}, {
							attributes: { "data-ve-is-actions-menu": true },
							style: { display: "flex", marginLeft: "auto", order: 99, padding: 0 },
							...this.options.folder_options
						})
					}, {
						attributes: {
							"data-folder": true,
							"data-path": local_full_path
						},
						name: all_files_in_directory[i].name,
						disabled: true,
						...this.options.folder_options
					}
				);
				
				//Add onclick event handler to hierarchy_obj[local_full_path] since we need navigation to work into a folder
				let local_folder_obj = hierarchy_obj[local_full_path];
				//local_folder_obj.setOwner(this.owner);
				local_folder_obj.element.ondblclick = (e) => {
					//Internal guard clause for protected elements
					if (e.target.closest(`button, input, .tippy-arrow, .tippy-box, .tippy-content`)) return;
					
					this.v = local_full_path;
					this.fireToBinding();
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
							rename: new ve.Button((e) => {
								ve.FileExplorer_rename(local_full_path, () => this.refresh());
							}, {
								name: `<icon>drive_file_rename_outline</icon>`,
								tooltip: "Rename",
								style: { padding: `var(--cell-padding)` }
							}),
							...Object.fromEntries(
								Object.entries(this.options.file_components_obj).map(([local_key, local_component]) => {
									return [local_key, local_component.clone ?
										local_component.clone() :
										new local_component.constructor(local_component.value, local_component.options)];
								})
							)
						}, {
							style: { display: "flex", marginLeft: "auto", order: 99, padding: 0 },
							...this.options.folder_options
						})
					}, {
						attributes: {
							"data-file": true,
							"data-path": local_full_path
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
		
		//[WIP] - Set .name.options.onuserchange listener for all this.hierarchy.components_obj
		
		setTimeout(() => {
			this.hierarchy.setOwner(this.owner, [this.owner]);
		});
	}
	
	/**
	 * Selects a specific file path, then returns {@link this.selected}.
	 * - Method of {@link ve.FileExplorer}
	 * 
	 * @param {string} arg0_file_path
	 * 
	 * @returns string[]
	 */
	select (arg0_file_path) {
		//Convert from parameters
		let file_path = arg0_file_path;
		
		//Push to this.selected if not already selected
		if (!this.selected.includes(file_path)) {
			this.selected.push(file_path);
			if (this.hierarchy.components_obj[file_path])
				this.hierarchy.components_obj[file_path].element.classList.add("selected");
		}
		
		//Return statement
		return this.selected;
	}
	
	/**
	 * Selects all file paths in the current folder being navigated.
	 * - Method of {@link ve.FileExplorer}
	 */
	selectAll () {
		//Declare local instance variables
		let all_files_in_directory = fs.readdirSync(this.value, { withFileTypes: true });
		this.deselectAll(); //Reset this.selected
		
		//Iterate over all_files_in_directory and select them
		for (let i = 0; i < all_files_in_directory.length; i++) {
			let local_full_path = path.join(this.value, all_files_in_directory[i].name);
			this.select(local_full_path);
		}
	}
	
	/**
	 * Sets the clipboard to the current selection.
	 * - Method of {@link ve.FileExplorer}
	 */
	setClipboard () {
		this.clipboard = structuredClone(this.selected);
	}
};

//Functional binding

/**
 * @returns {ve.FileExplorer}
 */
veFileExplorer = function () {
	//Return statement
	return new ve.FileExplorer(...arguments);
};