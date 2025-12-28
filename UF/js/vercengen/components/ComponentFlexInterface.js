/**
 * Refer to <span color = "yellow">{@link ve.Component}</span> for methods or fields inherited from this Component's parent such as `.options.attributes` or `.element`.
 * 
 * ##### Constructor:
 * - `arg0_value`: {@link Object}
 *   - `<category_key>`: {@link Object}
 *     - `<category_key>`: {@link Object}
 *     - `<component_key>`: {@link ve.Component}
 *       - `.options`: {@link Object}
 *         - `.flex_disabled=false`: {@link boolean}
 *     - `.type="horizontal"` - Either 'horizontal'/'vertical'.
 *   - `.type="horizontal"` - Either 'horizontal'/'vertical'.
 * 
 * @type {ve.FlexInterface}
 */
ve.FlexInterface = class extends ve.Component { //[WIP] - Finish CSS and JS handlers
	constructor (arg0_value, arg1_options) {
		//Convert from parameters
		let value = arg0_value;
		let options = (arg1_options) ? arg1_options : {};
			super(options);
		
		//Initialise options
		options.attributes = (options.attributes) ? options.attributes : {};
			
		//Declare local instance variables
		this.element = document.createElement("div");
			this.element.setAttribute("component", "ve-flex-interface");
			HTML.setAttributesObject(this.element, options.attributes);
			this.element.instance = this;
		this.options = options;
		this.value = value;
		
		//Set .v
		this.v = this.value;
	}
	
	get v () {
		//Return statement
		return this.value;
	}
	
	set v (arg0_value) {
		//Convert from parameters
		let value = (arg0_value) ? arg0_value : {};
		
		//Set this.value and refresh flex interface
		this.value = value;
		this.element.innerHTML = "";
		this.element.appendChild(ve.FlexInterface.generateHTMLRecursively(undefined, this.value, {
			type: this.value.type
		}));
		this.fireFromBinding();
	}
	
	handleEvents () { //[WIP] - Refactor function at a later date
		this.element.addEventListener("mousedown", (md) => {
			const target = md.target;
			const html = document.querySelector("html");
			
			// Check if the target is a resizer
			if (target.nodeType !== 1 || target.tagName !== "FLEX-RESIZER") {
				return;
			}
			
			const parent = target.parentNode;
			const isHorizontal = parent.classList.contains("horizontal");
			const isVertical = parent.classList.contains("vertical");
			
			if (isHorizontal) {
				// Horizontal container means we resize side-by-side items (X-axis)
				target.style.cursor = "col-resize";
				html.style.cursor = "col-resize";
				this.handleResize(md, "offsetWidth", "pageX", "col-resize", "ew-resize");
			} else if (isVertical) {
				// Vertical container means we resize stacked items (Y-axis)
				target.style.cursor = "row-resize";
				html.style.cursor = "row-resize";
				this.handleResize(md, "offsetHeight", "pageY", "row-resize", "ns-resize");
			}
		});
	}
	
	handleResize(md, sizeProp, posProp, activeCursor, resetCursor) { //[WIP] - Refactor function at a later date
		const r = md.target;
		const prev = r.previousElementSibling;
		const next = r.nextElementSibling;
		
		if (!prev || !next) return;
		
		md.preventDefault();
		
		// Capture initial state
		let prevSize = prev[sizeProp];
		let nextSize = next[sizeProp];
		const sumSize = prevSize + nextSize;
		
		// Use getComputedStyle to ensure we get current flex values if not set inline
		const getFlexGrow = (el) =>
			Number(window.getComputedStyle(el).flexGrow) || 0;
		
		const prevGrow = getFlexGrow(prev);
		const nextGrow = getFlexGrow(next);
		const sumGrow = prevGrow + nextGrow;
		
		let lastPos = md[posProp];
		
		const onMouseMove = (mm) => {
			const pos = mm[posProp];
			const d = pos - lastPos;
			
			prevSize += d;
			nextSize -= d;
			
			// Constrain boundaries
			if (prevSize < 0) {
				nextSize += prevSize;
				prevSize = 0;
			}
			if (nextSize < 0) {
				prevSize += nextSize;
				nextSize = 0;
			}
			
			// Calculate new proportional flex-grow values
			// Formula: (New Pixel Size / Total Pixel Size) * Total Flex Grow
			const prevGrowNew = sumGrow * (prevSize / sumSize);
			const nextGrowNew = sumGrow * (nextSize / sumSize);
			
			prev.style.flexGrow = prevGrowNew;
			next.style.flexGrow = nextGrowNew;
			
			lastPos = pos;
		};
		
		const onMouseUp = () => {
			const html = document.querySelector("html");
			html.style.cursor = "default";
			r.style.cursor = resetCursor;
			
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
			
			// Notify system of changes if binding exists
			this.fireToBinding();
		};
		
		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup", onMouseUp);
	}
	
	static generateHTMLRecursively (arg0_root_el, arg1_value, arg2_options) {
		//Convert from parameters
		let root_el = (arg0_root_el) ? arg0_root_el : document.createElement("flex");
		let value = (arg1_value) ? arg1_value : {};
		let options = (arg2_options) ? arg2_options : {};
		
		//Initialise value
		if (!value.type) value.type = "horizontal";
		
		//Modify root_el
		root_el.setAttribute("class", value.type);
		if (getComputedStyle(root_el).getPropertyValue("flex").length === 0)
			root_el.style.flex = "1";
		
		//Iterate over all keys in value
		Object.iterate(value, (local_key, local_value, local_index) => {
			let flex_item_el = document.createElement("flex-item");
				flex_item_el.style.flex = (local_index + 1).toString();
			let flex_resizer_el = document.createElement("flex-resizer");
			
			if (typeof local_value === "object" && local_key !== "options" && !(local_value instanceof ve.Component)) {
				if (!options.flex_disabled && local_index !== 0)
					root_el.appendChild(flex_resizer_el);
				
				let container_el = ve.FlexInterface.generateHTMLRecursively(undefined, local_value, local_value.options);
					root_el.appendChild(container_el);
			} else if (local_value instanceof ve.Component) {
				if (!options.flex_disabled && local_index !== 0)
					root_el.appendChild(flex_resizer_el);
				
				local_value.bind(flex_item_el);
				root_el.appendChild(flex_item_el);
			}
		});
		
		//Return statement
		return root_el;
	}
};