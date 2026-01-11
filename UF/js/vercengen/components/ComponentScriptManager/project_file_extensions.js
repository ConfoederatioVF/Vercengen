ve.ScriptManager._loadFileExtension = function (arg0_file_extension) {
	//Convert from parameters
	let file_extension = (arg0_file_extension) ? arg0_file_extension : "";
	
	//Declare local instance variables
	let file_extension_obj = {
		//Web & Stylesheets
		".css": "css",
		".scss": "scss",
		".less": "less",
		".html": "html",
		".htm": "html",
		".xhtml": "html",
		".js": "javascript",
		".mjs": "javascript",
		".cjs": "javascript",
		".ts": "typescript",
		".tsx": "typescript",
		".jsx": "javascript",
		".json": "json",
		".md": "markdown",
		".markdown": "markdown",
		".mdx": "mdx",
		
		//Programming Languages
		".c": "c",
		".h": "c",
		".cpp": "cpp",
		".cc": "cpp",
		".cxx": "cpp",
		".hpp": "cpp",
		".hh": "cpp",
		".cs": "csharp",
		".java": "java",
		".py": "python",
		".pyw": "python",
		".rb": "ruby",
		".go": "go",
		".rs": "rust",
		".swift": "swift",
		".kt": "kotlin",
		".kts": "kotlin",
		".php": "php",
		".phtml": "php",
		".dart": "dart",
		".ex": "elixir",
		".exs": "elixir",
		".erl": "erlang",
		".hrl": "erlang",
		".fs": "fsharp",
		".fsi": "fsharp",
		".fsx": "fsharp",
		".scala": "scala",
		".sc": "scala",
		".lua": "lua",
		".pl": "perl",
		".pm": "perl",
		".r": "r",
		".jl": "julia",
		
		//Data, Config & Database
		".xml": "xml",
		".xsd": "xml",
		".rss": "xml",
		".xaml": "xml",
		".yaml": "yaml",
		".yml": "yaml",
		".ini": "ini",
		".conf": "ini",
		".sql": "sql",
		".redis": "redis",
		".graphql": "graphql",
		".gql": "graphql",
		".proto": "proto",
		
		//Shell & Scripting
		".sh": "shell",
		".bash": "shell",
		".bat": "bat",
		".cmd": "bat",
		".ps1": "powershell",
		".psm1": "powershell",
		
		//Template Engines
		".hbs": "handlebars",
		".handlebars": "handlebars",
		".twig": "twig",
		".pug": "pug",
		".jade": "pug",
		".liquid": "liquid",
		".cshtml": "razor",
		".ftl": "freemarker2",
		
		//Infrastructure & Low Level
		".dockerfile": "dockerfile",
		"dockerfile": "dockerfile",
		".tf": "hcl",
		".hcl": "hcl",
		".bicep": "bicep",
		".wgsl": "wgsl",
		".sv": "systemverilog",
		".svh": "systemverilog",
		".v": "verilog",
		".s": "mips",
		
		//Specialised
		".abap": "abap",
		".cls": "apex", // Salesforce Apex
		".azcli": "azcli",
		".clj": "clojure",
		".cljs": "clojure",
		".coffee": "coffeescript",
		".cypher": "cypher", // Neo4j
		".ecl": "ecl",
		".flow": "flow9",
		".pq": "powerquery",
		".qs": "qsharp",
		".rst": "restructuredtext",
		".sol": "sol", // Solidity
		".aes": "aes", // Sophia
		".st": "st", // Structured Text
		".tcl": "tcl",
		".vb": "vb",
	};
	let model_obj = this.scene_monaco.editor.getModel();
	
	//Set new syntax highlighting
	if (file_extension_obj[file_extension])
		monaco.editor.setModelLanguage(model_obj, file_extension_obj[file_extension]);
};