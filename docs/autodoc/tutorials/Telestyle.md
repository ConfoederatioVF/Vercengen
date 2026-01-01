**Telestyle** is an immediate mode CSS-in-JS system that transforms JS objects into persistently applied CSS. As opposed to manual `style` attributes, Telestyle Objects/Themes allow for both parent and child selectors to be set as keys with nested attributes, including other selectors.

**Themes** can also be registered by declaring a new `ve.Theme` with variables like so. Note how Themes assign a key to a given Telestyle Object.

```js
//Constructs a new ve.Theme as 'theme-test'
new ve.Theme("theme-test", {
  "--header-colour": "white",
  "--header-font-family": "Karla",
  
  //Telestyle accepts nested selectors with either static styles (strings) or dynamic styles (immediate)
  "[component] h1": {
    fontSize: "2rem",
    visibility: (el) => el.header_hidden ? "hidden" : "visible"
  }
});
```

Themes can then be applied to new Components/compatible Features via their `arg1_options` flag:
```js
//Spawns a Window with a rich text editor that uses 'theme-test'
veWindow(veRichText("test", { theme: "theme-test" }));
```

By definition, all Vercengen Themes are stored in `ve.registry.themes`: Object.

### Data Structure (Telestyle Object):
- `<css_property>`: function|number|string - Functions must return either number/string.
- `"<css_variable>"`: string
- `"<css_selector>"`: Object
  - ... (Same as above)

### Selectors:

This section lists only selectors that are unique to Telestyle.

- `:nth-parent(n)` - Selects the nth-parent of an element, analogous to :nth-child(n).

### Themes:

**Vercengen** uses CSS variable themes applied at the root/parent node to control both **Component** and **Feature** appearance. The default defines are a minimalist black-red humanist theme, with the following variables:

```css
:root {
    --navbar-height: 2rem;
    
    --accent-primary-colour: rgba(200, 40, 40);
    --accent-secondary-colour: rgba(240, 60, 60);
    --bg-primary-colour: rgba(0, 0, 0, 0.85);
    --bg-secondary-colour: rgba(35, 35, 35);
    --hover-colour: rgba(255, 255, 255, 0.3);

    --header-colour: white;
    --header-font-family: "Karla";
    --header-font-size: 1rem;
    --header-font-weight: 700;
    --image-filter: brightness(100);
    --monospace-font-family: "Fira Sans";

    --body-colour: white;
    --body-font-family: "Karla";
    --body-font-size: 0.85rem;
    --body-font-weight: 300;

    --cell-padding: 0.25rem;
    --default-width: 12rem;
    --padding: 0.5rem;
}
```

These variables can be modified at any parent node, or wrapped as a reusable theme.