if (!global.GeoPNG) global.GeoPNG = {};
if (!global.GeoPNG.tasks) global.GeoPNG.tasks = {};

//Initialise basic raster tasks
{
  /**
   * Generates a blank raster filled with zeroes in float32 or int32 format.
   * 
   * @param {Object} arg0_task
   *  @param {string} [arg0_task.format="float32"] - Format of raster ("float32" or "int32").
   *  @param {number} [arg0_task.height=2160] - Raster height in pixels.
   *  @param {string} [arg0_task.output_file_path] - Target file path.
   *  @param {string} [arg0_task.output_path] - Target file path alias.
   *  @param {number} [arg0_task.width=4320] - Raster width in pixels.
   * 
   * @returns {Promise<string>}
   */
  GeoPNG.tasks.blank_raster = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
    let blank_data;
    let format = task.format || "float32";
    let height = task.height || 2160;
    let out_dir;
    let out_path = task.output_file_path || task.output_path;
    let width = task.width || 4320;

    blank_data = (format === "float32") ?
      new Float32Array(width * height) :
      new Int32Array(width * height);
    out_dir = path.dirname(out_path);
    if (!fs.existsSync(out_dir)) fs.mkdirSync(out_dir, { recursive: true });

    await GeoPNG.saveNumberRasterImageAsync({
      data: blank_data,
      file_path: out_path,
      format: format,
      height: height,
      width: width
    });

    //Return statement
    return out_path;
  };


  /**
   * Converts a float32 raster to int32 with specified rounding method.
   * 
   * @param {Object} arg0_task
   *  @param {string} arg0_task.input_path - Source float32 raster.
   *  @param {string} arg0_task.output_path - Destination int32 raster.
   *  @param {string} [arg0_task.rounding_method="round"] - Either "round" or "ceil".
   * 
   * @returns {Promise<string|null>}
   */
  GeoPNG.tasks.convert_to_int32 = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
    let input_path = task.input_path;
    let output_path = task.output_path;
    let rounding_method = task.rounding_method || "round";

    //Guard clause
    if (!fs.existsSync(input_path)) return null;

    let raster = await GeoPNG.loadNumberRasterImageAsync(input_path, { format: "float32" });
    let total_pixels = raster.data.length;
    let out_data = new Int32Array(total_pixels);

    if (rounding_method === "ceil") {
      for (let i = 0; i < total_pixels; i++) out_data[i] = Math.ceil(raster.data[i]);
    } else {
      for (let i = 0; i < total_pixels; i++) out_data[i] = Math.round(raster.data[i]);
    }

    let out_dir = path.dirname(output_path);
    if (!fs.existsSync(out_dir)) fs.mkdirSync(out_dir, { recursive: true });

    await GeoPNG.saveNumberRasterImageAsync({
      data: out_data,
      file_path: output_path,
      format: "int32",
      height: raster.height,
      width: raster.width
    });

    //Return statement
    return output_path;
  };


  /**
   * Copies a raster file from source to destination path.
   * 
   * @param {Object} arg0_task
   *  @param {string} [arg0_task.from_file_path] - Source file path.
   *  @param {string} [arg0_task.input_path] - Source file path alias.
   *  @param {string} [arg0_task.source_path] - Source file path alias.
   *  @param {string} [arg0_task.dest_path] - Destination file path alias.
   *  @param {string} [arg0_task.output_file_path] - Destination file path.
   *  @param {string} [arg0_task.output_path] - Destination file path alias.
   * 
   * @returns {Promise<string|null>}
   */
  GeoPNG.tasks.copy = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
    let from_file = task.from_file_path || task.source_path || task.input_path;
    let out_file = task.output_file_path || task.dest_path || task.output_path;

    //Guard clause
    if (!from_file || !out_file || !fs.existsSync(from_file)) return null;

    if (from_file.endsWith(".png") && typeof GeoPNG.isValidRaster === "function") {
      if (!GeoPNG.isValidRaster(from_file)) {
        console.error(`- [GeoPNG.tasks.copy] Skipping corrupted or empty PNG source file: ${from_file}`);
        return null;
      }
    }

    let out_dir = path.dirname(out_file);
    if (!fs.existsSync(out_dir)) fs.mkdirSync(out_dir, { recursive: true });
    fs.copyFileSync(from_file, out_file);

    //Return statement
    return out_file;
  };


  /**
   * Worker healthcheck ping.
   * 
   * @param {Object} [arg0_task]
   * 
   * @returns {Promise<Object>}
   */
  GeoPNG.tasks.ping = async function (arg0_task) {
    //Return statement
    return {
      pong: true,
      worker_id: (typeof worker_id !== "undefined") ? worker_id : 0
    };
  };
}
