[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / ILibraryLoadParams

# Interface: ILibraryLoadParams

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:135](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/model.ts#L135)

Fine-grained parameters for controlling which collections from a library to load.

## Properties

### excluded?

> `readonly` `optional` **excluded**: readonly [`FilterPattern`](../type-aliases/FilterPattern.md)[]

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:145](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/model.ts#L145)

Patterns to exclude. Collection names matching any pattern are excluded (takes precedence over included).
Strings are matched exactly, RegExp patterns use `.test()`.

***

### included?

> `readonly` `optional` **included**: readonly [`FilterPattern`](../type-aliases/FilterPattern.md)[]

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:140](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/model.ts#L140)

Patterns to include. If specified, only collection names matching at least one pattern are included.
Strings are matched exactly, RegExp patterns use `.test()`.

***

### recurseWithDelimiter?

> `readonly` `optional` **recurseWithDelimiter**: `string`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:149](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/model.ts#L149)

Whether to recurse into subdirectories and use a delimiter to form composite collection names.
