if (!global.GeoPNG) global.GeoPNG = {};
if (!global.GeoPNG.tasks) global.GeoPNG.tasks = {};

//Initialise generic and dynamic execution tasks
{
  /**
   * Executes a serialised dynamic handler function in worker context.
   * 
   * @param {Object} arg0_task
   *  @param {string} arg0_task.handler_source - Serialised JS function body.
   *  @param {any} [arg0_task.item] - Item payload.
   *  @param {number} [arg0_task.index] - Index payload.
   *  @param {Object} [arg0_task.context] - Context payload.
   * 
   * @returns {Promise<any>}
   */
  GeoPNG.tasks.eval_handler = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
    let AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    let fn = new AsyncFunction(
      "item",
      "index",
      "context",
      "GeoPNG",
      "Statistics",
      "fs",
      "path",
      `"use strict"; return (${task.handler_source})(item, index, context);`
    );

    //Return statement
    return await fn(
      task.item,
      task.index,
      task.context,
      global.GeoPNG,
      global.Statistics,
      global.fs,
      global.path
    );
  };


  /**
   * Dynamically requires and invokes a class method in worker context.
   * 
   * @param {Object} arg0_task
   *  @param {any[]} [arg0_task.args] - Function arguments.
   *  @param {string} arg0_task.class_name - Global class or object identifier.
   *  @param {string} arg0_task.method_name - Method to invoke on target class.
   *  @param {string} [arg0_task.module_path] - Relative path to require first.
   * 
   * @returns {Promise<any>}
   */
  GeoPNG.tasks.invoke_method = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
    let args = task.args || [];
    let target_class;

    if (task.module_path && typeof safeRequire === "function")
      safeRequire(task.module_path);

    target_class = global[task.class_name];
    if (!target_class || typeof target_class[task.method_name] !== "function")
      throw new Error(`Target class or method not found: ${task.class_name}.${task.method_name}`);

    //Return statement
    return await target_class[task.method_name](...args);
  };


  /**
   * Performs pixelwise raster mathematical operations (multiply, divide, add, subtract, overlay, slope/delta, scale).
   * 
   * @param {Object} arg0_task
   *  @param {string} [arg0_task.format="float32"] - Output format.
   *  @param {string} [arg0_task.format_1] - Input 1 format override.
   *  @param {string} [arg0_task.format_2] - Input 2 format override.
   *  @param {string} arg0_task.input_path_1 - First operand raster path.
   *  @param {string} [arg0_task.input_path_2] - Second operand raster path.
   *  @param {string} [arg0_task.operation="multiply"] - Math operation key.
   *  @param {string} arg0_task.output_path - Result raster path.
   *  @param {number} [arg0_task.scalar] - Scalar multiplier.
   * 
   * @returns {Promise<string|null>}
   */
  GeoPNG.tasks.raster_operation = async function (arg0_task) {
    //Convert from parameters
    let task = (arg0_task) ? arg0_task : {};

    //Declare local instance variables
    let format = task.format || "float32";
    let format_1 = task.format_1 || format;
    let format_2 = task.format_2 || format;
    let input_path_1 = task.input_path_1 || task.a_path || task.input_path;
    let input_path_2 = task.input_path_2 || task.b_path;
    let op = task.operation || task.op || "multiply";
    let output_path = task.output_path;

    //Guard clause
    if (!input_path_1 || !fs.existsSync(input_path_1)) return null;

    let raster1 = await GeoPNG.loadNumberRasterImageAsync(input_path_1, { format: format_1 });
    let total_pixels = raster1.data.length;
    let output_data = new Float32Array(total_pixels);

    if (input_path_2 && fs.existsSync(input_path_2)) {
      let data1 = raster1.data;
      let raster2 = await GeoPNG.loadNumberRasterImageAsync(input_path_2, { format: format_2 });
      let data2 = raster2.data;

      if (op === "multiply") {
        for (let i = 0; i < total_pixels; i++) {
          let v1 = data1[i];
          let v2 = data2[i];
          if (v1 > 0 && v2 > 0 && isFinite(v1) && isFinite(v2)) {
            let val = v1 * v2;
            output_data[i] = (isFinite(val) && val < 3.402823466e38) ? val : 0;
          } else {
            output_data[i] = 0;
          }
        }
      } else if (op === "divide") {
        let clamp_alpha = (task.log_compression_threshold !== undefined) ?
          (task.clamp_alpha || task.log_compression_threshold * 0.1) : 0;
        let max_val = (task.max_val !== undefined) ? task.max_val : 3.402823466e38;
        let min_denom = (task.min_denominator !== undefined) ? task.min_denominator : 1e-12;
        let threshold = task.log_compression_threshold;

        for (let i = 0; i < total_pixels; i++) {
          let v1 = data1[i];
          let v2 = data2[i];
          if (v1 > 0 && v2 >= min_denom && isFinite(v1) && isFinite(v2)) {
            let val = v1 / v2;
            if (isFinite(val)) {
              if (threshold !== undefined && val > threshold) {
                val = threshold + clamp_alpha * Math.log(1 + ((val - threshold) / clamp_alpha));
              }
              if (val > max_val) val = max_val;
              output_data[i] = (isFinite(val) && val < 3.402823466e38) ? val : 0;
            } else {
              output_data[i] = 0;
            }
          } else {
            output_data[i] = 0;
          }
        }
      } else if (op === "add") {
        for (let i = 0; i < total_pixels; i++) output_data[i] = data1[i] + data2[i];
      } else if (op === "subtract") {
        for (let i = 0; i < total_pixels; i++) output_data[i] = data1[i] - data2[i];
      } else if (op === "subtract_clamped") {
        for (let i = 0; i < total_pixels; i++) output_data[i] = Math.max(0, data1[i] - data2[i]);
      } else if (op === "overlay") {
        for (let i = 0; i < total_pixels; i++) output_data[i] = (data2[i] > 0) ? data2[i] : data1[i];
      } else if (op === "slope" || op === "delta") {
        let scalar = (task.scalar !== undefined) ? task.scalar : 1;
        for (let i = 0; i < total_pixels; i++) {
          let v1 = data1[i];
          let v2 = data2[i];
          output_data[i] = (isFinite(v1) && isFinite(v2)) ? (v1 - v2) * scalar : 0;
        }
      }
    } else if (task.scalar !== undefined) {
      let data1 = raster1.data;
      let scalar = task.scalar;
      for (let i = 0; i < total_pixels; i++) output_data[i] = data1[i] * scalar;
    }

    let out_dir = path.dirname(output_path);
    if (!fs.existsSync(out_dir)) fs.mkdirSync(out_dir, { recursive: true });

    await GeoPNG.saveNumberRasterImageAsync({
      data: output_data,
      file_path: output_path,
      format: format,
      height: raster1.height,
      width: raster1.width
    });

    //Return statement
    return output_path;
  };
}
