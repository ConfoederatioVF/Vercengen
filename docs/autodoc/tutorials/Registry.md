`ve.registry` contains the main **Components**, **Features**, and **Themes** for Vercengen. It is mainly used for both linting purposes and persistent settings. It is colloquially known as tbe **Registry**.

The Registry can manually be set by the program prior to Vercengen initialisation by populating `window.ve_registry`. Note that when doing this, you must override the set of all flags contained by default. It can be modified post-initialisation.

It is defined in `./UF/js/vercengen/startup/vercengen_startup.js` [[View Source]](https://github.com/Confoederatio/Vercengen/blob/main/UF/js/vercengen/startup/vercengen_startup.js).

### Data Structure:
`ve.registry`: Object
- `.debug_mode=true`: boolean
- `.components`:
  - `<component_key>`: ve.Component
- `.features`:
  - `<feature_key>`: ve.Feature
- `.themes`:
  - `<theme_key>`: ve.Theme
- `.settings`: Object
  - `.automatic_naming=false`: boolean
  - `.ScriptManager`: Object
    - `.save_file`: boolean|string - The file path to store saved settings in. `false` disables this option.
    - `.share_settings_across_instances=true`: boolean