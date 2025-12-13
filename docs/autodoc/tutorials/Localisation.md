**Localisation** refers to strings which add multilingual functionality to Vercengen. Localisation is simply parsed using the `loc()` function, which is available at a global level.

By default, the following locales are available: EN-GB, FR, DE; with British English being used as the main locale if not specified in `ve.registry.locale`. To change Vercengen's default language, make sure to set the registry's locale to the locale key you wish to target:

```js
ve.registry.locale = "de"; //Changes locale to DE (German)
```

### Adding a new language:

When adding a new language, edit `/UF/js/startup/vercengen_localisation.js` or use `Object.assign(ve.registry.localisation, ...)` to add your given language.

If the locale is set to something other than EN-GB, `loc()` will attempt to append the locale key to target its translated equivalent. Assuming that the locale is 'fr', this means that `FileExplorer_back` will transform into `FileExplorer_back_fr` for all localisation purposes.

This means that localisation should ideally work like all other locale systems. HTML tags and inline styling can also be used when adding new language strings.

### Using loc():

`loc(arg0_string, argn_arguments...)`:
- `arg0_string`: The string to input. Any part of the stirng delimited like so: £n£ will be replaced by its corresponding argument in `argn_arguments`.
- `argn_arguments...`: What to replace `£n£` with.

`loc()` simply works as a formatting function. The initial string (not a string literal) is parsed such that each £n£ is replaced by its appropriate variable in `argn_arguments`.

For example:

```js
ve.registry.localisation.FileExplorer_move_files_de = "£1£ Dateien verschieben";

let test_move_files = loc("ve.registry.localisation.FileExplorer_move_files", 
  String.formatNumber(this.selected.length));
```

The following function will result in `test_move_files` returniong a string that looks something like this: `2 Dateien verscheiben` when used or logged, assuming that `ve.registry.locale = "de"`.