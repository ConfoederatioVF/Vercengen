<img src = "https://raw.githubusercontent.com/Confoederatio/Vercengen/refs/heads/main/gfx/vercengen_logo.png">

<span style = "display: flex;">
    <span>UI ⊆ State.</span>
    <span style = "margin-left: auto; order: 99; padding: 0;"><small>(<u>UI is a subset of state</u>).</small></span>
</span>
<br>

## Less Is More.

Vercengen is a software engine built to halve your work by eliminating frontend redundancy. Instead, UIs are declared as variable types in your data structures with immediate reflection and directional control.

All interfaces are split into <b><a href = "ve.Component.html">Components</a></b>, which represent user-facing inputs and displays, and <b><a href = "ve.Feature.html">Features</a></b>, which encapsulate Components; UI is rendered in <i>de facto</i> immediate mode. Everything in Vercengen is in service of the developer: there exists no build process, auto-documentation, first-class Undo/Redo, immediate-mode CSS-in-JS, associated util libraries, variable theming, and inline documentation for usage.

**Batteries Included:** Unlike other frameworks, a default features and components library is included out-of-the-box, and can be modified as needed.

## Dataflow:

Vercengen provides directional bindings for your data, without the risk of race conditions, as the program and user agent can never be the same.
- `.binding`: string, UI <-> State, fires `.onchange(v, e)` Event.
- `.from_binding`: string, UI <- State, fires `.onprogramchange(v, e)` Event.
- `.to_binding`: string, UI -> State, fires `.onuserchange(v, e)` Event.

`global`, `this`, and `window` are all acceptable prefixes for binding strings, and a reflection engine automatically ensures directional synchronisation. `v` contains the value, and `e` the referenced <a href = "ve.Component.html">ve.Component</a>.

## Examples:

Example: Separately updating counters.

Vercengen (10 lines):
```js
Counter = class extends ve.Class { constructor () {
	super();
	this.count = veNumber(0, { name: "Counter:" });
	this.dec_btn = veButton(() => this.count.v--, {
		name: "Decrement" });
	this.inc_btn = veButton(() => this.count.v++, {
		name: "Increment" });
} }; 
new Counter().open("instance", { name: "Counter 1" });
new Counter().open("instance", { name: "Counter 2" });
```

Example: WYSIWYG Word Editor.

Vercengen (4 lines):
```js
word_editor = veWindow({
  file_explorer: veFileExplorer(__dirname, { y: 0 }),
  text_editor: veWordProcessor("Hello world.", { y: 0 })
}, { name: "Word Editor", width: "40rem" });
```

Example: Nested Bindings with Delay.

Vercengen (15 lines):
```js
ColourPicker = class extends ve.Class { constructor () {
	super();
	this.interface = veInterface({
		colour: veColour([255, 255, 255], {
			binding: "this.colour" }),
		opacity: veRange(1, {
			binding: "this.opacity" })
	});
	
	//Wait 1 second
	setTimeout(() => {
		this.colour = [0, 0, 0]; //Alias binding, immediately reflected
		this.interface.opacity.v = 0.5; //Native binding
	}, 1000);
} };
```

## Extensibility:
Need to import a third-party component? Boilerplate for Vercengen is minimal:

```js
ve.CustomComponent = class extends ve.Component {
  constructor (arg0_value, arg1_options) {
    this.element; //Must export this.element, any user-driven changes should call this.fireToBinding();
    this.value = arg0_value;
  }
  
  get v () { //Returns the value stored in the component
    return this.value;
  }
  set v (arg0_value) { //Sets the value stored in the component
    this.value = arg0_value;
    this.fireFromBinding();
  }
};
```

## Getting Started:
Vercengen is currently native to **Electron**/**Node.js** with better support planned for in-browser versions via a single-file CDN. Bootstrapping a Vercengen app requires the following steps.

Running Vercengen in the browser means that certain components (i.e. FileExplorer, ScriptManager) will not be presently operable, and you may have to make manual adjustments as such.

1. [Download](<https://github.com/Confoederatio/Vercengen/>) the current UF folder and drop it into your root directory.
2. Ensure you have the following dependencies installed for the full feature set in your `package.json` file:
   ```json
    "devDependencies": {
      "acorn": "^5.0.3",
      "acorn-dynamic-import": "^2.0.2",
      "acorn-jsx-walk": "^1.0.1",
      "file-saver": "^1.3.3",
      "imports-loader": "^0.7.1",
      "better-docs": "^2.7.3",
      "electron": "^38.1.2",
      "jsdoc": "^4.0.5",
      "minami": "^1.2.3",
      "node-blockly": "https://github.com/JC-Orozco/node-blockly.git",
      "snapsvg": "^0.5.1",
      "taffydb": "^2.7.3"
    }
   ```
3. Run `npm install` in your root directory.
4. In your `index.html`, add the following script tag:
    ```js
   <script src = "./UF/js/vercengen/startup/vercengen_startup.js" type = "text/javascript"></script>
   ```
5. Customise your load directories/files. Patterns accept wildcards (*), exclusions (!), and folders/file paths. Last match wins.
   ```js
   ve.start({ load_files: [
     "core/",
     "!core/startup.js"
   ]});
   ```

But if that's too much work for you, fork our [bootstrap repository](https://github.com/Confoederatio/Vercengen/) instead.

---

<small>CTD. Generated with Vercengen/Autodoc.</small><br>
<a href = "https://confoederatio.org/">Confoederatio</a> | <a href = "https://confoederatiodocs.info/">Confoederatio Docs</a>