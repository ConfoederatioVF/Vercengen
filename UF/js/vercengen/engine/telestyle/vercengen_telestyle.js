//[WIP] - Document Telestyle
//Initialise functions
{
	/**
	 * Applies dynamic (function-based) styles recursively each frame.
	 */
	HTML.applyDynamicTelestyle = function (arg0_el, arg1_dynamic_obj) {
		let el = arg0_el;
		let dynamic_obj = arg1_dynamic_obj;
		
		Object.iterate(dynamic_obj, (local_key, local_value) => {
			if (typeof local_value === "object" && !Array.isArray(local_value)) {
				let targets = HTML.resolveSelector(el, local_key);
				for (let local_target of targets)
					HTML.applyDynamicTelestyle(local_target, local_value);
			} else if (typeof local_value === "function") {
				let computed_style = local_value(el);
				if (computed_style !== undefined && computed_style !== null) {
					if (local_key.startsWith("--"))
						el.style.setProperty(local_key, computed_style.toString());
					else el.style[local_key] = computed_style.toString();
				}
			}
		});
	};
	
	/**
	 * Applies static (non-function) styles recursively, once.
	 */
	HTML.applyStaticTelestyle = function (arg0_el, arg1_style_obj) {
		let el = arg0_el;
		let style_obj = arg1_style_obj;
		
		Object.iterate(style_obj, (local_key, local_value) => {
			if (typeof local_value === "object" && !Array.isArray(local_value)) {
				let targets = HTML.resolveSelector(el, local_key);
				for (let i = 0; i < targets.length; i++)
					HTML.applyStaticTelestyle(targets[i], local_value);
			} else if (typeof local_value !== "function") {
				if (local_key.startsWith("--"))
					el.style.setProperty(local_key, local_value.toString());
				else el.style[local_key] = local_value.toString();
			}
		});
	};
	
	HTML.applyTelestyle = function (arg0_el, arg1_style) {
		//Convert from parameters
		let el = (typeof arg0_el === "object") ? arg0_el : document.querySelector(arg0_el);
		let style = arg1_style;
		
		//Apply CSS style to el
		if (typeof style === "object") {
			HTML.applyTelestyleObject(el, style);
		} else if (typeof style === "string") {
			el.setAttribute("style", style);
		}
	};
	
	HTML.applyTelestyleObject = function (arg0_el, arg1_style_obj) {
		// Convert arguments
		let el =
			typeof arg0_el === "object" ? arg0_el : document.querySelector(arg0_el);
		let style_obj = arg1_style_obj ? arg1_style_obj : {};
		
		if (!el) return;
		
		// Clone and split style object
		let mutated_style_obj = structuredClone(style_obj);
		let { static: staticStyles, dynamic: dynamicStyles } =
			HTML.splitStaticDynamicTelestyle(mutated_style_obj);
		let registry = HTML.ve_css_registry;
		
		// Apply existing static styles immediately to current subtree
		HTML.applyStaticTelestyle(el, staticStyles);
		registry.set(el, { mutated_style_obj, dynamic: dynamicStyles });
		
		// --- set up "silent" observer ---
		// --- set up "smart" observer ---
		if (el._telestyleObserver) el._telestyleObserver.disconnect();
		
		const observer = new MutationObserver((mutationsList) => {
			for (const mutation of mutationsList) {
				if (mutation.type === "childList") {
					// handle added nodes
					for (const addedNode of mutation.addedNodes) {
						if (!(addedNode instanceof HTMLElement)) continue;
						
						const nodesToCheck = [addedNode, ...addedNode.querySelectorAll("*")];
						
						for (const node of nodesToCheck) {
							// reapply static and dynamic styles for any match
							Object.iterate(staticStyles, (selector, styleValue) => {
								if (
									typeof styleValue === "object" &&
									typeof selector === "string"
								) {
									try {
										if (node.matches(selector)) {
											HTML.applyStaticTelestyle(node, styleValue);
										}
									} catch (err) {}
								}
							});
							
							Object.iterate(dynamicStyles, (selector, dynValue) => {
								if (
									typeof dynValue === "object" &&
									typeof selector === "string"
								) {
									try {
										if (node.matches(selector)) {
											HTML.applyDynamicTelestyle(node, dynValue);
										}
									} catch (err) {}
								}
							});
						}
					}
					
					// handle removed nodes if cleanup registry needed
					for (const removedNode of mutation.removedNodes) {
						if (HTML.ve_css_registry?.has(removedNode))
							HTML.ve_css_registry.delete(removedNode);
					}
				} else if (mutation.type === "attributes") {
					// re-trigger style application when attributes change
					const target = mutation.target;
					Object.iterate(staticStyles, (selector, styleValue) => {
						try {
							if (target.matches(selector)) {
								HTML.applyStaticTelestyle(target, styleValue);
							}
						} catch (err) {}
					});
				}
			}
		});
		
		observer.observe(el, {
			childList: true,
			subtree: true,
			attributes: true,
		});
		
		el._telestyleObserver = observer;
		
		// Apply dynamic styles once
		if (Object.keys(dynamicStyles).length > 0) {
			HTML.applyDynamicTelestyle(el, dynamicStyles);
		}
	};
	
	/**
	 * Resolves a selector relative to an element.
	 * Supports :nth-parent(n) and normal query selectors.
	 */
	HTML.resolveSelector = function (arg0_el, arg1_selector) {
		//Convert from parameters
		let el = arg0_el;
		let selector = arg1_selector;
		
		//Declare local instance variables
		let parent_match = selector.match(/^:nth-parent\((\d+)\)$/);
		
		if (parent_match) {
			let n = parseInt(parent_match[1]);
			let target = el;
			
			//While loop until parent element is found
			while (n-- > 0 && target.parentElement) 
				target = target.parentElement;
			
			//Return statement
			return target ? [target] : [];
		}
		
		//Return statement; normal descendant functions
		try {
			return el.querySelectorAll(selector);
		} catch (e) {
			console.error(e);
			return [];
		}
	}
	
	/**
	 * Splits static and dynamic properties into two trees.
	 */
	HTML.splitStaticDynamicTelestyle = function (arg0_object) {
		//Convert from parameters
		let object = arg0_object;
		
		//Declare local instance variables
		let static_obj = {};
		let dynamic_obj = {};
		
		//Iterate over all values in object
		Object.iterate(object, (local_key, local_value) => {
			if (typeof local_value === "object" && !Array.isArray(local_value)) {
				let nested = HTML.splitStaticDynamicTelestyle(local_value);
				
				static_obj[local_key] = nested.static;
				dynamic_obj[local_key] = nested.dynamic;
			} else if (typeof local_value === "function") {
				dynamic_obj[local_key] = local_value;
			} else {
				static_obj[local_key] = local_value;
			}
		});
		
		//Return statement
		return {
			dynamic: dynamic_obj,
			static: static_obj
		};
	}
}
