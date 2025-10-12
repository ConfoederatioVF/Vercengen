//Initialise functions
{
	if (!global.HTML) global.HTML = {};
	
	HTMLElement.prototype.addUFEventListener = function (arg0_event_key, arg1_function) {
		//Convert from parameters
		let event_key = arg0_event_key;
		let event_function = arg1_function;
		
		//Handle event_key cases
		if (event_key === "htmlchange") {
			let observer = new MutationObserver((mutations_list) => {
				for (let local_mutation of mutations_list)
					if (["childList", "characterData", "subtree"].includes(local_mutation.type))
						event_function(this);
			});
			observer.observe(this, {
				characterData: true,
				childList: true,
				subtree: true
			});
		}
	};
	
	HTML.initialise = function () {
		document.addEventListener("keydown", (e) => {
			if (e.keyCode === 17) { //Ctrl
				if (is_naissance)
					try { map.scrollWheelZoom.disable(); } catch (e) {} //Disable map zoom upon Ctrl down
				HTML.ctrl_pressed = true;
			}
		});
		document.addEventListener("keyup", (e) => {
			if (e.keyCode === 17) { //Ctrl
				if (is_naissance)
					try { map.scrollWheelZoom.enable(); } catch (e) {} //Re-enable map zoom upon Ctrl up
				delete HTML.ctrl_pressed;
			}
		});
		document.addEventListener("mousemove", (e) => {
			HTML.mouse_x = e.clientX;
			HTML.mouse_y = e.clientY;
		});
	};
}