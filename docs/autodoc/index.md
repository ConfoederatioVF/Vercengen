<img src = "https://i.postimg.cc/ZZk34WkC/vercengen-logo.png">

<span style = "display: flex;">
    <span>UI ⊆ State.</span>
    <span style = "margin-left: auto; order: 99; padding: 0;"><small>(<u>UI as a subset of state</u>).</small></span>
</span>
<br>

## Less Is More.

Vercengen is a software engine built to halve your work by eliminating frontend redundancy. Instead, UIs are declared as variable types in your data structures with immediate reflection and directional control.

All interfaces are split into <b>Components</b>, which represent user-facing inputs and displays, and <b>Features</b>, which encapsulate Components; UI is rendered in <i>de facto</i> immediate mode. Everything in Vercengen is in service of the developer: there exists no build process, auto-documentation, first-class Undo/Redo, associated util libraries, and inline documentation for usage.

[WIP] - Remaining content is a work-in-progress.

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

Example: WYSIWYG Word Editor:

Vercengen (4 lines):
```js
word_editor = veWindow({
  file_explorer: veFileExplorer(__dirname, { y: 0 }),
  text_editor: veWYSIWYG("Hello world.", { y: 0 })
}, { name: "Word Editor", width: "40rem" });
```