/**
 * Refer to <span color = "yellow">{@link ve.Component}</span> for methods or fields inherited from this Component's parent such as `.options.attributes` or `.element`.
 *
 * A wrapper for the Monaco Editor (v0.44.0). Supports syntax highlighting, themes, and native Electron paste fixes.
 * - Functional binding: <span color=00ffff>{@link ve.Monaco}</span>
 *
 * ##### Constructor:
 * - `arg0_value`: {@link string} - The initial text content of the editor.
 * - `arg1_options`: {@link Object}
 *   - `.language`: {@link string} - e.g., "javascript", "json", "html". Defaults to "javascript".
 *   - `.theme`: {@link string} - Initial theme name.
 *
 * ##### Instance:
 * - `.v`: {@link string} - The current text content of the editor.
 * - `.editor`: {@link Object} - The raw Monaco editor instance.
 *
 * ##### Static Fields:
 * - `.instances`: {@link Array}<{@link ve.Monaco}>
 *
 * ##### Static Methods:
 * - <span color=00ffff>{@link ve.Monaco.setTheme|setTheme}</span>(arg0_theme_name:{@link string}) | {@link Promise}
 *
 * @augments ve.Component
 * @memberof ve.Component
 * @type {ve.Monaco}
 */
ve.Monaco = class extends ve.Component {
	static instances = [];
	
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = arg0_value;
		let options = (arg1_options) ? arg1_options : {};
			super(options);
		
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
		
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-monaco");
			this.element.style.height = "100%";
			this.element.instance = this;
		this.options = options;
		this._pending_value = (value === null || value === undefined) ? "" : value.toString();
		
		//Initialise Monaco 0.44.0
		window.monaco_require(["vs/editor/editor.main"], () => {
			this.editor = monaco.editor.create(this.element, {
				value: this._pending_value,
				language: options.language || "javascript",
				theme: options.theme || "vs-dark",
				automaticLayout: true,
				fontSize: 14,
				minimap: { enabled: true },
				contextmenu: true,
				formatOnPaste: false,
				autoIndent: "advanced",
			});
			
			//Fix paste event
			this.editor.addAction({
				id: "electron-native-paste",
				label: "Paste",
				keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV],
				contextMenuGroupId: "9_cutcopypaste",
				run: (ed) => {
					try {
						const electron = window.node_require ? window.node_require("electron") : null;
						if (electron && electron.clipboard) {
							const text = electron.clipboard.readText();
							const selection = ed.getSelection();
							
							ed.executeEdits("native-paste", [{
								range: selection,
								text: text,
								forceMoveMarkers: true,
							}]);
							ed.pushUndoStop();
						}
					} catch (e) {
						console.error("ve.Monaco: Paste Error", e);
					}
				},
			});
			
			//Handle value changes
			this.editor.onDidChangeModelContent(() => his.fireToBinding());
			
			//Clear pending state
			delete this._pending_value;
		});
		
		// Initialise value
		this.v = value;
	}
	
	/**
	 * Returns the present text content of the editor.
	 * - Accessor of: {@link ve.Monaco}
	 *
	 * @alias v
	 * @memberof ve.Component.ve.Monaco
	 * @type {string}
	 */
	get v () {
		if (!this.editor) return (this._pending_value) ? this._pending_value : "";
		return this.editor.getValue();
	}
	
	/**
	 * Sets the text content of the editor.
	 * - Accessor of: {@link ve.Monaco}
	 *
	 * @alias v
	 * @memberof ve.Component.ve.Monaco
	 *
	 * @param {string} arg0_value
	 */
	set v (arg0_value) {
		// Convert from parameters
		let value = (arg0_value === null || arg0_value === undefined) ? "" : String(arg0_value);
		
		if (!this.editor) {
			this._pending_value = value;
		} else {
			try {
				this.editor.setValue(value);
			} catch (e) {
				console.error("ve.Monaco: setValue failed", e);
			}
		}
		
		this.fireFromBinding();
	}
	
	/**
	 * Dynamically loads and sets a Monaco theme from a remote repository.
	 * - Method of: {@link ve.Monaco}
	 *
	 * @param {string} arg0_theme_name
	 */
	async setTheme(arg0_theme_name) {
		let theme_name = arg0_theme_name;
		try {
			let response = await fetch(
				`https://raw.githubusercontent.com/brijeshb42/monaco-themes/master/themes/${theme_name}.json`,
			);
			let themeData = await response.json();
			monaco.editor.defineTheme(theme_name, themeData);
			monaco.editor.setTheme(theme_name);
		} catch (e) {
			console.error("ve.Monaco: Theme load failed", theme_name, e);
		}
	}
};

// Functional binding

/**
 * @returns {ve.Monaco}
 */
veMonaco = function () {
	// Return statement
	return new ve.Monaco(...arguments);
};