ve.ScriptManager._indexDocumentation = async function (arg0_element, arg1_options) {
	//Convert from parameters
	let element = (arg0_element) ? arg0_element : document.createElement("div");
	let options = (arg1_options) ? arg1_options : {};
	
	//Initialise options
	options.max_file_size = Math.returnSafeNumber(options.max_file_size, 500*1024); //Maximum file size at 500KB
	
	//Declare local instance variables
	let compiler_options = {
		allowJs: true,
		allowNonTsExtensions: true,
		target: monaco.languages.typescript.ScriptTarget.ESNext,
		moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
		checkJs: true,
	};
		monaco.languages.typescript.javascriptDefaults.setCompilerOptions(compiler_options);
		monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compiler_options);
	let current_folder = (this._settings.project_folder !== "none") ?
		this._settings.project_folder : this.leftbar_file_explorer.v;
	
	//Clear cached documentation if applicable
	element.innerHTML = `Clearing documentation ..`;
	if (!this._documentation_files) {
		this._documentation_files = [];
	} else {
		//Iterate over all this._documentation_files
		for (let i = 0; i < this._documentation_files.length; i++)
			this._documentation_files[i].dispose();
		this._documentation_files = [];
	}
	
	//Iterate over all_files and check their extname for js/ts and document them
	element.innerHTML = `Indexing files in project ..`;
	let all_files = await File.getAllFiles(current_folder);
	
	for (let i = 0; i < all_files.length; i++) try {
		if (all_files[i].endsWith(".js") || all_files[i].endsWith(".ts")) {
			let local_file_stats = fs.statSync(all_files[i]);
			
			if (local_file_stats.size <= options.max_file_size) {
				let local_data = fs.readFileSync(all_files[i], "utf8");
				
				//.js/.ts handling
				if (all_files[i].endsWith(".js") || all_files[i].endsWith(".ts"))
					this._documentation_files.push(monaco.languages.typescript.javascriptDefaults.addExtraLib(
						local_data,
						monaco.Uri.file(all_files[i]).toString()
					));
			}
		}
		
		//Waiting tick to update status
		if (i % 100 === 0 || i === all_files.length - 1) {
			element.innerHTML = `Indexed ${String.formatNumber(i)}/${String.formatNumber(all_files.length)} file(s)`;
			await new Promise((resolve) => setTimeout(resolve, 0));
		}
	} catch (e) {
		console.error(e);
	}
	element.innerHTML = `Indexed ${String.formatNumber(all_files.length)} file(s).`;
};