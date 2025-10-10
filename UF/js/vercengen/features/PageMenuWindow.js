/**
 * Represents a PageMenuWindow Feature that contains a page_obj type directly analogous to that used in {@link ve.PageMenu}. The associated {@link ve.Window} is stored in `.window`.
 * @type {ve.PageMenuWindow}
 * 
 * ##### Options:
 * - `arg0_page_obj`: {@link Object}
 *   - `<page_key>`: {@link Object}
 *     - `.name`: {@link string} - '<page_key>' by default.
 *     - `.components_obj:` {@link Object}<{@link ve.Component}>
 *     - `.options`: {@link Object} - Options for the {@link ve.Interface} .components_obj will be wrapped inside.
 * - `arg1_options`: {@link Object}
 *   - Inherited from {@link ve.Window|ve.Window.options}:
 *   - `anchor="top_left"` - Either 'bottom_left'/'bottom_right'/'top_left'/'top_right'.
 *   - `height="12rem"`: {@link number}
 *   - `width="12rem"`: {@link number}
 *   - `x=HTML.mouse_x`: {@link number}
 *   - `y=HTML.mouse_y`: {@link number}
 *   -
 *   - `mode="window"`: {@link string} - Either 'static_ui'/'static_window'/'window'.
 *   - `name=""`: {@link string} - Auto-resolves to 'Window' instead if `.can_rename=true`.
 *   - `theme`: {@link string} - The CSS theme to apply to the Feature.
 *   -
 *   - `can_close`: {@link boolean}
 *   - `can_rename`: {@link boolean}
 *   - `draggable`: {@link boolean}
 *   - `headless`: {@link boolean}
 *   - `resizeable`: {@link boolean}
 *   - Inherited from {@link ve.PageMenu|ve.PageMenu.options}
 *   - `.page_menu_options`: {@link Object}
 *     - `.attributes`: {@link Object}
 *       - `<attribute_key>`: {@link string}
 *     - `.name`: {@link string} - Refers to the name of the current page.
 *     - `.onchange`: {@link function}(this:{@link ve.PageMenu})
 *     - `.style`: {@link Object}
 *       - `<style_key>`: {@link string}
 */
ve.PageMenuWindow = class {
	constructor (arg0_page_obj, arg1_options) {
		//Convert from parameters
		let page_obj = arg0_page_obj;
		let options = (arg1_options) ? arg1_options : {};
		
		//Initialise options
		options.page_menu_options = (options.page_menu_options) ? options.page_menu_options : {};
		
		//Declare local instance variables
		this.page_menu = new ve.PageMenu(page_obj, options.page_menu_options);
		this.window = new ve.Window({ page_menu_obj: this.page_menu }, options);
	}
};