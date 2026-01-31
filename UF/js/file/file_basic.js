//Initialise functions
{
	if (!global.File)
		/**
		 * The namespace for all UF/File utility functions, typically for static methods.
		 * 
		 * @namespace File
		 */
		global.File = {};
	
	/**
	 * Whether a file is inside a folder path.
	 * @alias File.containsPath
	 * 
	 * @param {string} arg0_file_path
	 * @param {string} arg1_folder_path
	 * 
	 * @returns {boolean}
	 */
	File.containsPath = function (arg0_file_path, arg1_folder_path) {
		const resolvedFile = path.resolve(arg0_file_path);
		const resolvedFolder = path.resolve(arg1_folder_path);
		
		//Return statement
		return (
			resolvedFile === resolvedFolder ||
			resolvedFile.startsWith(resolvedFolder + path.sep)
		);
	};
	
	/**
	 * Returns all drives in the current operating system.
	 * @alias File.getAllDrives
	 * 
	 * @returns {string[]}
	 */
	File.getAllDrives = function () {
		const platform = process.platform;
		
		try {
			if (platform === "win32") {
				// Run WMIC command to list logical drives
				const output = child_process.execSync("wmic logicaldisk get name", { encoding: "utf8" });
				return output
				.split("\n")
				.map((line) => line.trim())
				.filter((line) => /^[A-Z]:$/i.test(line)) // e.g. "C:"
				.map((drive) => drive + "\\");
			} else {
				// POSIX systems
				// Common mount points: "/", "/Volumes/*" (macOS), "/mnt/*" or "/media/*" (Linux)
				const drives = ["/"];
				
				const possibleDirs = ["/Volumes", "/mnt", "/media"];
				for (const dir of possibleDirs) {
					if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
						const subMounts = fs
						.readdirSync(dir)
						.map((name) => path.join(dir, name))
						.filter((p) => {
							try {
								return fs.statSync(p).isDirectory();
							} catch {
								return false;
							}
						});
						drives.push(...subMounts);
					}
				}
				return drives;
			}
		} catch (err) {
			console.error("getAllDrives() failed:", err);
			return [];
		}
	};
	
	/**
	 * Returns all files in a current folder path.
	 * @alias File.getAllFiles
	 * 
	 * @param {string} arg0_folder_path
	 * @param {Object} [arg1_options]
	 *  @param {string[]} [arg1_options.excluded_paths]
	 * 
	 * @returns {string[]}
	 */
	File.getAllFiles = async function (arg0_folder_path, arg1_options) {
		//Convert from parameters
		let root_path = path.resolve(arg0_folder_path);
		let options = arg1_options || {};
		
		//Declare local instance variables
		let excluded_paths = (options.excluded_paths || []).map((p) => path.resolve(p));
		
		try {
			let entries = await fs.promises.readdir(root_path, { withFileTypes: true });
			let paths = await Promise.all(
				entries.map(async (entry) => {
					let full_path = path.resolve(root_path, entry.name);
					
					//Internal guard clause if the current full path is in the excluded list
					if (excluded_paths.includes(full_path))
						return [];
					if (entry.isDirectory())
						//Recursively call File.getAllFiles if possible
						return await File.getAllFiles(full_path, options);
					return full_path;
				}),
			);
			
			return paths.flat();
		} catch (err) {
			console.error(`File.getAllFiles: Error reading directory ${root_path}:`, err);
			throw err;
		}
	};
	
	/**
	 * Returns all files in a current folder synchronously.
	 * @alias File.getAllFilesSync
	 * 
	 * @param {string} arg0_folder_path
	 * 
	 * @returns {string[]}
	 */
	File.getAllFilesSync = function (arg0_folder_path) {
		//Convert from parameters
		let folder_path = arg0_folder_path;
		
		//Declare local instance variables
		let all_files = fs.readdirSync(folder_path, {
			recursive: true,
			withFileTypes: true
		});
		
		//Return statement
		return all_files.filter((entry) => entry.isFile())
			.map((entry) => path.join(entry.path, entry.name));
	};
	
	/**
	 * Whether the selected file path is a valid drive.
	 * @alias File.isDrive
	 * 
	 * @param {string} arg0_file_path
	 * 
	 * @returns {boolean}
	 */
	File.isDrive = function (arg0_file_path) {
		//Convert from parameters
		let file_path = arg0_file_path;
		
		//Declare local instance variables
		let resolved = path.resolve(file_path);
		
		//Check if file_path is drive
		try {
			let stats = fs.statSync(resolved);
			if (!stats.isDirectory()) return false; //Internal guard clause if not a directory
		} catch (e) {
			//Return statement
			return false;
		}
		
		//Return statement
		return (resolved === path.parse(resolved).root);
	};
}