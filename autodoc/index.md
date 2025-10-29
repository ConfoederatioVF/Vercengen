<img src = "../gfx/vercengen_logo.png">

<span style = "display: flex;">
    <span>UI ⊆ State.</span>
    <span style = "margin-left: auto; order: 99; padding: 0;"><small>(<u>UI as a subset of state</u>).</small></span>
</span>
<br>

## Less Is More.

Vercengen is a software engine built to halve your work by eliminating frontend redundancy. Instead, UIs are declared as variable types in your data structures with immediate reflection and directional control.

All interfaces are split into <b>Components</b>, which represent user-facing inputs and displays, and <b>Features</b>, which encapsulate Components; UI is rendered in <i>de facto</i> immediate mode. Everything in Vercengen is in service of the developer: there exists no build process, auto-documentation, first-class Undo/Redo, associated util libraries, and inline documentation for usage.

## Examples:

Example: Separately updating counters.

Vercengen (10 lines), Vanilla JS:
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

Vue (18 lines), [adapted source](https://vuejs.org/guide/essentials/component-basics):
```js
//./ButtonCounter.vue
import { ref } from 'vue'
export default {
	setup() {
		const count = ref(0)
		return { count }
	},
	template: `
    You clicked me {{ count }} times.
    <button @click="count--">Decrement</button>
    <button @click="count++">Increment</button>`
}
//SFC, separate file
<script setup>
import ButtonCounter from './ButtonCounter.vue'
</script>
<template>
  <ButtonCounter />
  <ButtonCounter />
</template>
```

React (18 lines), [source](https://react.dev/learn):
```jsx
import { useState } from 'react';
export default function MyApp() {
	return (
		<div>
			<h1>Counters that update separately</h1>
			<MyButton />
			<MyButton />
		</div>
	);
}
function MyButton() {
	const [count, setCount] = useState(0);
	return (<>
        <button onClick={() => setCount(count - 1)}>Decrement</button>
        <span> {count} </span>
        <button onClick={() => setCount(count + 1)}>Increment</button>
    </>);
}
```

WYSIWYG Word Editor:

Vercengen (4 lines):
```js
word_editor = veWindow({
  file_explorer: veFileExplorer(__dirname, { y: 0 }),
  text_editor: veWYSIWYG("Hello world.", { y: 0 })
}, { name: "Word Editor", width: "40rem" });
```