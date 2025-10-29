<img src = "https://i.postimg.cc/ZZk34WkC/vercengen-logo.png">

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
  text_editor: veWYSIWYG("Hello world.", { y: 0 })
}, { name: "Word Editor", width: "40rem" });
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
Vercengen is currently native to **Electron**/**Node.js** with better support planned for in-browser versions via a single-file CDN. Building a Vercengen app is as simple as 1, 2, 3.

1. [Download](<https://github.com/Confoederatio/Vercengen/>) the current UF folder and drop it into your root directory.
2. In your `index.html`, add the following script tag:
    ```js
   <script src = "./UF/js/vercengen/startup/vercengen_startup.js" type = "text/javascript"></script>
   ```
3. Customise your load directories/files. Patterns accept wildcards (*), exclusions (!), and folders/file paths. Last match wins.
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