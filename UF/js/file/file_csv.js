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
	 * Loads a CSV file as an array of objects.
	 * @alias File.loadCSVAsArray
	 *
	 * @param {string} arg0_file_path
	 * @param {Object} [arg1_options]
	 *  @param {string} [arg1_options.delimiter=","]
	 *
	 * @returns {Array<Object>}
	 */
	File.loadCSVAsArray = function (arg0_file_path, arg1_options) {
		//Convert from parameters
		let file_path = arg0_file_path;
		let options = arg1_options ? arg1_options : {};
		
		//Initialise options
		if (!options.delimiter) options.delimiter = ",";
		
		//Declare local instance variables
		let csv_string = fs.readFileSync(file_path, "utf8");
		let csv_array = csv_string.trim().split(/\r?\n/);
		let parsed_rows = csv_array.map(function (line) {
			return File.parseCSVLine(line, options);
		});
		let return_array = [];
		
		let headers = parsed_rows[0];
		for (let i = 1; i < parsed_rows.length; i++) {
			let row = parsed_rows[i];
			let row_obj = {};
			for (let j = 0; j < headers.length; j++) {
				let header_key = headers[j];
				if (header_key) {
					row_obj[header_key] = row[j] !== undefined ? row[j] : null;
				}
			}
			return_array.push(row_obj);
		}
		
		return return_array;
	};
	
	/**
	 * Loads a CSV file as JSON.
	 * @alias File.loadCSVAsJSON
	 *
	 * @param {string} arg0_file_path
	 * @param {Object} [arg1_options]
	 *  @param {string} [arg1_options.delimiter=","]
	 *  @param {string} [arg1_options.mode="vertical"] - Either 'vertical'/'horizontal'. Whether the header is horizontal or vertical.
	 *
	 * @returns {Object}
	 */
	File.loadCSVAsJSON = function (arg0_file_path, arg1_options) {
		//Convert from parameters
		let file_path = arg0_file_path;
		let options = arg1_options ? arg1_options : {};
		
		//Intialise options
		if (!options.delimiter) options.delimiter = ",";
		if (!options.mode) options.mode = "vertical";
		
		//Declare local instance variables
		let csv_string = fs.readFileSync(file_path, "utf8");
		let csv_array = csv_string.trim().split(/\r?\n/);
		let parsed_rows = csv_array.map(function (line) {
			return File.parseCSVLine(line, options);
		});
		let return_obj = {};
		
		if (options.mode === "vertical") {
			let headers = parsed_rows[0];
			for (let i = 1; i < parsed_rows.length; i++) {
				let row = parsed_rows[i];
				let key = row[0];
				if (!key) continue;
				if (!return_obj[key]) {
					return_obj[key] = {};
					for (let j = 1; j < headers.length; j++) {
						return_obj[key][headers[j]] = [];
					}
				}
				for (let j = 1; j < headers.length; j++) {
					return_obj[key][headers[j]].push(row[j] !== undefined ? row[j] : null);
				}
			}
		} else if (options.mode === "horizontal") {
			// In horizontal mode, each column after the first is a key
			let property_names = parsed_rows[0];
			for (let col = 1; col < property_names.length; col++) {
				let key = property_names[col];
				if (!key) continue;
				if (!return_obj[key]) {
					return_obj[key] = {};
					// Initialise arrays for each row label (excluding the first row)
					for (let row = 1; row < parsed_rows.length; row++) {
						let row_label = parsed_rows[row][0];
						return_obj[key][row_label] = [];
					}
				}
				for (let row = 1; row < parsed_rows.length; row++) {
					let row_label = parsed_rows[row][0];
					let value = parsed_rows[row][col] !== undefined ? parsed_rows[row][col] : null;
					return_obj[key][row_label].push(value);
				}
			}
		}
		
		return return_obj;
	};
	
	/**
	 * Parses a single line of CSV.
	 * @alias File.parseCSVLine
	 *
	 * @param {string} arg0_line
	 * @param {Object} [arg1_options]
	 *  @param {string} [arg1_options.delimiter=","]
	 *
	 * @returns {Array<string>}
	 */
	File.parseCSVLine = function (arg0_line, arg1_options) {
		//Convert from parameters
		let line = arg0_line;
		let options = arg1_options ? arg1_options : {};
		
		//Initialise options
		if (!options.delimiter) options.delimiter = ",";
		
		let current = "";
		let in_quotes = false;
		let result = [];
		
		for (let i = 0; i < line.length; i++) {
			if (line[i] === '"' && (i === 0 || line[i - 1] !== "\\")) {
				in_quotes = !in_quotes;
			} else if (line[i] === options.delimiter && !in_quotes) {
				result.push(current.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
				current = "";
			} else {
				current += line[i];
			}
		}
		result.push(current.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
		
		return result;
	};
}