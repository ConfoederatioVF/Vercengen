//Initialise functions
{
	if (!global.GeoASC) global.GeoASC = {};
	
	//[WIP] - This function needs a complete refactor
	GeoASC.convertToPNG = async function (arg0_input_file_path, arg1_output_file_path, arg2_options) {
		
	};
	
	GeoASC.readFile = function (arg0_file_path) {
		//Convert from parameters
		let file_path = arg0_file_path;
		
		//Declare local instance variables
		let checks_passed = 0;
		let data_columns = 0;
		let data_frame = [];
		let data_rows = 0;
		let is_header = true;
		let no_data_value = undefined;
		let raw_data = fs.readFileSync(file_path, "utf8").split("\n");
		let row_index = 0;
		
		//Iterate over all raw_data lines
		for (let i = 0; i < raw_data.length; i++) {
			let local_line = raw_data[i].trim();
			
			//Internal guard clause; skip empty lines
			if (local_line == "") continue;
			
			//Header parsing
			if (is_header) {
				if (checks_passed < 3) {
					let split_line = local_line.split(" ");
					
					if (local_line.startsWith("ncols")) {
						data_columns = parseInt(split_line[1]);
						checks_passed++;
					} else if (local_line.startsWith("nrows")) {
						data_rows = parseInt(split_line[1]);
						checks_passed++;
					} else if (local_line.startsWith("NODATA_value")) {
						no_data_value = split_line[1];
						checks_passed++;
					}
				} else {
					//End of header; initialise data_frame
					is_header = false;
					data_frame = new Array(data_rows);
					
					for (let x = 0; x < data_rows; x++)
						data_frame[x] = new Array(data_columns);
				}
				continue;
			}
			
			//Data parsing
			let local_values = local_line.split(/\s+/);
			
			for (let x = 0; x < data_columns; x++)
				data_frame[row_index][x] = (local_values[x] == no_data_value) ?
					undefined : parseFloat(local_values[x]);
			
			row_index++;
			if (row_index >= data_rows) break; //Stop processing once all rows are read
		}
		
		//Return statement
		return data_frame;
	};
}