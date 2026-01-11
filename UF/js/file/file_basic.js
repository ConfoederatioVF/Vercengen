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
	
	File.getAllFiles = async function (arg0_folder_path) {
		const folder_path = arg0_folder_path;
		
		try {
			// Get all entries in the current directory (files and folders)
			// We do NOT use recursive: true here to ensure we get Dirent objects
			const entries = await fs.promises.readdir(folder_path, { withFileTypes: true });
			
			// Map each entry to a promise
			const paths = await Promise.all(
				entries.map(async (entry) => {
					const fullPath = path.join(folder_path, entry.name);
					
					// If it's a directory, recurse into it
					if (entry.isDirectory()) {
						return await File.getAllFiles(fullPath);
					}
					
					// If it's a file, return the path
					return fullPath;
				}),
			);
			
			// .flat() converts the nested arrays from recursion into a single-level array
			return paths.flat();
		} catch (err) {
			console.error(`File.getAllFiles: Error reading directory ${folder_path}:`, err);
			throw err;
		}
	};
	
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