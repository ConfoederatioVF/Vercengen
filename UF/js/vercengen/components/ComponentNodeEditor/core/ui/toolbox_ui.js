//Initialise methods
{
	ve.NodeEditor.prototype.drawToolbox = function () {
		let page_menu_obj = {};
		let unique_categories = [];
		
		Object.iterate(this.options.node_types, (local_key, local_value) => {
			if (typeof local_value !== "object" || !local_value) return;
			if (local_value.is_internal && !this.options.show_internal) return;
			
			let category = local_value.category || "Uncategorised";
			if (!unique_categories.includes(category))
				unique_categories.push(category);
		});
		
		if (unique_categories.length === 0)
			unique_categories = ["Expressions", "Filters", "I/O", "Custom"];
		if (!this.options.exclude_all) unique_categories.unshift("All");
		
		for (let i = 0; i < unique_categories.length; i++) {
			let category_key = unique_categories[i];
			let filter_names_obj = {};
			let local_search_select_obj = {};
			
			for (let x = 0; x < unique_categories.length; x++)
				filter_names_obj[
					`data-${unique_categories[x]
					.toLowerCase()
					.replace(/[^a-z0-9]/g, "_")}`
					] = unique_categories[x];
			
			Object.iterate(this.options.node_types, (local_key, local_value) => {
				if (typeof local_value !== "object" || !local_value) return;
				if (local_value.is_internal && !this.options.show_internal) return;
				
				let local_category = local_value.category || "Uncategorised";
				let local_category_options =
					this.options.category_types[local_category] || {};
				
				let local_category_colour = Colour.convertRGBAToHex(
					local_category_options.colour || [255, 255, 255],
				);
				let local_category_text_colour = Colour.convertRGBAToHex(
					local_category_options.text_colour || [0, 0, 0],
				);
				
				if (local_category === category_key || category_key === "All") {
					let toolbox_button = new ve.Button(
						() => {
							if (local_key === "ve_comment") {
								let comment_window_components = {
									text_input: new ve.Text("", {
										placeholder: "Enter comment...",
									}),
								};
								
								comment_window_components.confirm = new ve.Button(
									(e) => {
										let comment_text = comment_window_components.text_input.v;
										this.main.nodes.push(
											new ve.NodeEditorDatatype(
												{
													coords: this._mouse_coords,
													key: local_key,
													name: comment_text,
													...local_value,
												},
												{
													category_options: local_category_options,
													node_editor: this,
													...local_value.options,
												},
											),
										);
										if (this.current_comment_window)
											this.current_comment_window.close();
									},
									{ name: "Place Comment" },
								);
								
								this.current_comment_window = new ve.Window(
									comment_window_components,
									{ name: "Add Comment", width: "20rem", height: "auto" },
								);
								return;
							}
							
							this.main.nodes.push(
								new ve.NodeEditorDatatype(
									{
										coords: this._mouse_coords,
										key: local_key,
										...local_value,
									},
									{
										category_options: local_category_options,
										node_editor: this,
										...local_value.options,
									},
								),
							);
						},
						{
							attributes: {
								[`data-${local_category
								.toLowerCase()
								.replace(/[^a-z0-9]/g, "_")}`]: "true",
							},
							name: local_value.name ? local_value.name : local_key,
							style: {
								button: {
									backgroundColor: local_category_colour,
									color: local_category_text_colour,
								},
							},
						},
					);
					
					if (
						local_category === "Custom" &&
						this.main.custom_node_types[local_key]
					) {
						setTimeout(() => {
							if (toolbox_button.element && !this.options.disable_custom_nodes) {
								toolbox_button.element.addEventListener("contextmenu", (e) => {
									e.preventDefault();
									new ve.ContextMenu(
										{
											edit_node: new ve.Button(
												() => {
													this._openCustomNodeEditor(local_key);
												},
												{ name: "<icon>edit</icon> Edit Node" },
											),
											delete_node: new ve.Button(
												() => {
													this._deleteCustomNode(local_key);
												},
												{ name: "<icon>delete</icon> Delete Node" },
											),
										},
										{
											x: e.clientX,
											y: e.clientY,
										},
									);
								});
							}
						}, 0);
					}
					
					local_search_select_obj[local_key] = toolbox_button;
				}
			});
			
			if (category_key === "Custom" || category_key === "All")
				local_search_select_obj["create_custom"] = new ve.Button(
					() => {
						this._openCustomNodeEditor();
					},
					{
						name: "<icon>add_circle</icon> Create Custom Node",
						limit: () => (!this.options.disable_custom_nodes),
						style: {
							button: {
								border: "1px dashed var(--body-colour)",
								display: "block",
								marginTop: "var(--padding)",
							},
						},
					},
				);
			
			page_menu_obj[category_key] = {
				name: category_key,
				components_obj: {
					search_select: new ve.SearchSelect(local_search_select_obj, {
						hide_filter: category_key !== "All",
						filter_names: filter_names_obj,
					}),
				},
			};
		}
		
		if (this.toolbox_window) this.toolbox_window.close();
		this.toolbox_window = new ve.PageMenuWindow(page_menu_obj, {
			name: "Toolbox",
			height: "40vh",
			width: "23rem",
			can_rename: false,
		});
	};
}
