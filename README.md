# Vercengen

<div align = "center">
	<h3>UI is a subset of State.</h3>
	<img src = "https://i.postimg.cc/NG4Lxfjc/vercengen-logo.png" height = "64">

[![Join our community!](https://img.shields.io/discord/548994743925997570?label=Discord&style=for-the-badge)](https://discord.gg/89kQY2KFQz) ![](https://img.shields.io/github/languages/code-size/Confoederatio/Eoscala-Velkscala?style=for-the-badge)
	
</div>

> [!NOTE]
> Read our documentation [website](https://confoederatio.org/Vercengen)! 

### Abstract.

Vercengen is an immediate mode frontend software engine developed for Confoederatio wth a focus on rapid application development (RAD), in which UI/UX is simply part of your state. It is used as the main frontend for most Confoederatio applications and provides simple adjustable CSS themes by tinkering with variables.

Vercengen supports built-in file explorers, nested hierarchies, delta action undo/redo trees, searchable lists, sortable lists, word processors, spreadsheet editors, IDEs, recursive context menus and tooltips, window management, and much more. For a list of all available components, please reference the documentation [here](https://confoederatio.org/Vercengen).

<br>
<table>
  <tr>
    <td colspan = "2">
      <img src = "https://i.postimg.cc/Syt0JjZr/vercengen-script-manager.png">
      <div align = "center">(Scriptly IDE)</div>
    </td>
  </tr>
  <tr>
    <td width = "50%">
      <img src = "https://i.postimg.cc/7xQvfbBW/naissance-01.png">
      <div align = "center">(Naissance GIS)</div>
    </td>
    <td width = "50%">
      <img src = "https://i.postimg.cc/HpPGVjSb/constele-red-01.png">
      <div align = "center">(Constele Red/Eoscala)</div>
    </td>
  </tr>
  <tr>
    <td>
      <img src = "https://i.postimg.cc/2CGNN0n5/constele-red-02.png">
      <div align = "center">(Constele Red/Stadestér)</div>
    </td>
    <td>
      <img src = "https://i.postimg.cc/D2YV8mjT/naissance-02.png">
      <div align = "center">(SketchMap Editor)</div>
    </td>
  </tr>
  <tr>
    <td colspan = "2">
      <img src = "https://i.postimg.cc/zq7YYxTv/constele-red-03.png">
      <div align = "center">(Node-based distributed compute DAG)</div>
    </td>
  </tr>
</table>

**Vercengen** is currently regarded as being mature and future updates are expected to mainly involve adding additional options and new components rather than breaking changes. The library is highly extensible, and any HTMLElement can be registered as a component so long as it has a get v()/set v(arg0_value) accessor contract and a `this.element` local instance variable.

The framework is batteries included and supports a range of Features (which encapsulate Components), and Components. UIs are built by simply including Vercengen variable types in your data structures - the reflection engine is in charge of parsing everything.

Default **Features** include:
- Confirm, ContextMenu, Modal, Navbar, PageMenuWindow, Scene, Toast, Tooltip, Window

Default **Components** include:
- BIUF (Rich Text), Button, Checkbox, Colour, Datalist, Date, DateLength, File, FileExplorer, HTML, Hierarchy, HierarchyDatatype, Interface, List, Map, MultiTag, Number, PageMenu, Password, Radio, Range, RawInterface, ScriptManager, ScriptManagerBlockly, ScriptManagerCodemirror, Select, Table, Telephone, Text, Time, Toggle, URL, UndoRedo, WYSIWYG

<br>
<img src = "https://confoederatio.org/Vercengen/autodoc/images/undo_redo_preview.png">
<div align = "center"><b>Note.</b> Undo/Redo supports both a Timeline view as well as a graphical Tree view.</div>

### Example:

Editing Vercengen inside Vercengen with functional bindings (1 line):
```js
veWindow(veScriptManager())
```
Nested bindings with delay (16 lines):
```js
ColourPicker = class extends ve.Class { constructor () {
	super();
	this.interface = veInterface({
		colour: veColour([255, 255, 255], {
			binding: "this.colour" }),
		opacity: veRange(1, {
			binding: "this.opacity" })
	});
	super.open("instance");
	
	//Wait 1 second
	setTimeout(() => {
		this.colour = [0, 0, 0]; //Alias binding, immediately reflected
		this.interface.opacity.v = 0.5; //Native binding
	}, 1000);
} };
```
Separately updating counters (10 lines):
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
WYSIWYG Word Editor (4 lines):
```js
word_editor = veWindow({
  file_explorer: veFileExplorer(__dirname, { y: 0 }),
  text_editor: veWYSIWYG("Hello world.", { y: 0 })
}, { name: "Word Editor", width: "40rem" });
```

### Getting Started.

Bootstrap:
1. Download the current repository.
2. Run `npm install`.
3. Play with Vercengen!

Loading into an existing project:
1. Download the current [`UF/`](https://github.com/Confoederatio/Vercengen/tree/main/UF) folder and drop it into your root directory.
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
3. Run `npm install`.
4. In your `index.html`, add the following script tag. Consider enabling `nodeIntegration: true` if using Electron.
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

<div align = "center">
<br>
<img src = "https://i.postimg.cc/HxNQXRvc/ctd-coat-of-arms-logo.png" height = "64">
</div>
