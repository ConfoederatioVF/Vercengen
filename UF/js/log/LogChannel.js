//Initialise functions
{
	if (!global.log)
		/**
		 * The namespace for all UF/Log utility functions, typically for designating log channels.
		 * 
		 * @namespace log
		 */
		global.log = {};
	
	/**
	 * Creates a new log channel that can be accessed by log.<channel_key>() for logging. Should ideally be initialised upon startup. This is used for custom multi-channel logging. Channels are mirrored in DevTools as well as having DOM-facing viewports and consoles via {@link ve.Log}, {@link ve.ScriptManager}.
	 * 
	 * ##### Constructor:
	 * - `arg0_key`; {@link string} - The key to use for channel logging. log.<channel_key>, log.<channel_key>_warn, log.<channel_key>_error are valid channels afterwards.
	 * - `arg1_options`: {@link Object}
	 *   - `.colour`: {@link Array}<{@link number}, {@link number}, {@link number}, {@link number}>|{@link string} - The colour to use for the background.
	 *   - `.text_colour`: {@link Array}<{@link number}, {@link number}, {@link number}, {@link number}>|{@link string} - The text colour to use for the foreground. Detected as either 'white/'black' based on luminance by default.
	 * 
	 * ##### Instance:
	 * - `.log_el`: {@link HTMLElement}
	 * - `.key`: {@link string}
	 * - `.options`: {@link Object}
	 * 
	 * ##### Methods:
	 * - <span color=00ffff>{@link ve.Log.clear|clear}</span>()
	 * - <span color=00ffff>{@link ve.Log.close|close}</span>()
	 * - <span color=00ffff>{@link ve.Log.error|error}</span>(argn_arguments:{@link any})
	 * - <span color=00ffff>{@link ve.Log.log|log}</span>(argn_arguments:{@link any})
	 * - <span color=00ffff>{@link ve.Log.open|open}</span>()
	 * - <span color=00ffff>{@link ve.Log.warn|warn}</span>(argn_arguments:{@link any})
	 * - <span color=00ffff>{@link ve.Log.print|print}</span>(arg0_type:{@link string}, argn_arguments:{@link any})
	 * - <span color=00ffff>{@link ve.Log.remove|remove}</span>()
	 * 
	 * ##### Static Fields:
	 * - `.instances`: {@link Array}<{@link log.Channel}>
	 *   
	 * ##### Static Methods:
	 * - <span color=00ffff>{@link ve.Log.update|update}</span>() - Updates all {@link ve.Log} instances and alphabetically sorts channel order.
	 * 
	 * @type {log.Channel}
	 */
	log.Channel = class {
		static instances = [];
		
		constructor (arg0_key, arg1_options) {
			//Convert from parameters
			let key = arg0_key;
			let options = (arg1_options) ? arg1_options : {};
			
			//Initialise options
			let bg_colour = (options.colour) ? 
				options.colour : ve.registry.settings.Channel.default_bg_colour;
			let text_colour = (options.text_colour) ? 
				options.text_colour : ve.registry.settings.Channel.default_text_colour;
				if (text_colour === "auto") text_colour = Colour.getBestTextColour(bg_colour);
			
			let default_post_css = `background: transparent; color: inherit;`;
			let default_pre_css = `background: ${bg_colour}; color: ${text_colour}; padding: 2px 5px; border-radius: 3px; font-weight: bold;`;
			
			options.post_css = (options.post_css) ? `${default_post_css} ${options.post_css}` : default_post_css;
			options.pre_css = (options.pre_css) ? `${default_pre_css} ${options.pre_css}` : default_pre_css;
			
			//Declare local instance variables
			this.log_el = document.createElement("div");
				this.log_el.classList.add("log-element");
			this.key = key;
			this.options = options;
			
			//Internal guard clause if duplicate
			if (!log[key]) {
				log[key] = this.log.bind(this);
				log[`${key}_error`] = this.error.bind(this);
				log[`${key}_warn`] = this.warn.bind(this);
			} else {
				console.warn(`log.${key} already exists as a custom logging channel. It cannot be overridden.`);
			}
			
			//Push to instances
			log.Channel.instances.push(this);
			log.Channel.update();
		}
		
		/**
		 * Clears the current console channel.
		 * - Method of: {@link log.Channel}
		 */
		clear () { this.log_el.innerHTML = ""; }
		
		/**
		 * Closes the available console window if already open.
		 * - Method of: {@link log.Channel}
		 */
		close () { if (this.console_window) this.console_window.close(); }
		
		/**
		 * Prints an error message to the console channel, analogous to {@link console.error}.
		 * - Method of: {@link log.Channel}
		 * 
		 * @param argn_arguments
		 */
		error (...argn_arguments) { this.print("error", argn_arguments); }
		
		/**
		 * Prints a log message to the console channel, analogous to {@link console.log}.
		 * - Method of: {@link log.Channel}
		 * 
		 * @param argn_arguments
		 */
		log (...argn_arguments) { this.print("log", argn_arguments); }
		
		/**
		 * Opens a UI for the given console channel. DOM-facing.
		 * - Method of: {@link log.Channel}
		 */
		open () {
			if (this.console_window) this.console_window.close();
			this.console_window = new ve.Window({
				current_log_el: new ve.HTML(this.log_el)
			}, {
				can_rename: false,
				name: this.key,
				width: "20rem"
			});
		}
		
		/**
		 * Prints a warning message to the console channel, analogous to {@link console.warn}.
		 * - Method of: {@link log.Channel}
		 *
		 * @param argn_arguments
		 */
		warn (...argn_arguments) { this.print("warn", argn_arguments); }
		
		/**
		 * Prints a message to the given console channel.
		 * - Method of: {@link log.Channel}
		 * 
		 * @param {string} arg0_type - The console type. Either 'log'/'warn'/'error'.
		 * @param {any[]} argn_arguments - The arguments passed to the log function
		 */
		print (arg0_type, argn_arguments) {
			//Convert from parameters
			let type = arg0_type;
			let args = [...argn_arguments];
			
			//Declare local instance variables
			let template = `%c${this.key.toUpperCase()}%c `;
			
			//If the first argument is a string, we can merge it into the template; this allows the user to still use %s, %d, etc. in their own messages
			if (typeof args[0] === "string") {
				let message = args.shift();
				console[type](
					`${template}${message}`,
					this.options.pre_css,
					this.options.post_css,
					...args,
				);
			} else {
				console[type](template, this.options.pre_css, this.options.post_css, ...args);
			}
			
			//Push to current this.log_el
			let local_msg_el = document.createElement("div");
				local_msg_el.classList.add("uf-log-line");
				local_msg_el.classList.add(type);
				argn_arguments.forEach((local_arg) => {
					let part_el = document.createElement("span");
						part_el.classList.add("log-part");
						part_el.style.marginRight = `var(--padding)`;
						
					//Handle errors
					if (type === "error" && local_arg instanceof Error) {
						let error_el = document.createElement("pre");
						error_el.innerText = local_arg.stack || local_arg.message;
						part_el.appendChild(error_el);
					} else if (typeof local_arg === "string") {
						part_el.innerText = String(local_arg);
					} else {
						let local_object_inspector = new ve.ObjectInspector(local_arg, {
							style: { padding: 0 }
						});
						
						if (local_object_inspector.element.innerHTML.length > 10000) {
							let placeholder = document.createElement("button");
							placeholder.innerText = "Show large object ..";
							placeholder.onclick = () => {
								let local_confirm_modal = new ve.Confirm(`Are you sure you want to view this large object? It has a length of ${String.formatNumber(local_object_inspector.element.innerHTML.length)} character(s).`, {
									special_function: () => {
										placeholder.replaceWith(local_object_inspector.element);
										local_object_inspector.bind(part_el);
									}
								});
							};
							part_el.appendChild(placeholder);
						} else {
							local_object_inspector.bind(part_el);
						}
					}
					
					local_msg_el.appendChild(part_el);
				});
			
			this.log_el.appendChild(local_msg_el);
		}
		
		/**
		 * Removes the given console channel.
		 * - Method of: {@link log.Channel}
		 */
		remove () {
			//Iterate over all channels and remove it
			for (let i = 0; i < log.Channel.instances.length; i++)
				if (log.Channel.instances[i] === this.key)
					log.Channel.instances.splice(i, 1);
			
			//Remove log[key]
			delete log[this.key];
			log.Channel.update();
		}
		
		/**
		 * Updates all associated {@link log.Channel} components to ensure that they remain in-sync.
		 * 
		 * @alias #update
		 * @memberof log.Channel
		 */
		static update () {
			//Sort ve.Log.instances first
			ve.Log.instances.sort((a, b) => a.key.localeCompare(b.key));
			
			//Iterate over all ve.Log.instances and draw them
			for (let i = 0; i < ve.Log.instances.length; i++)
				ve.Log.instances[i].draw();
		}
	};
}