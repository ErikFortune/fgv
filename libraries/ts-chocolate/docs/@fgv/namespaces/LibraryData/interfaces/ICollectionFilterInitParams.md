[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / ICollectionFilterInitParams

# Interface: ICollectionFilterInitParams\<T\>

Defined in: [ts-chocolate/src/packlets/library-data/collectionFilter.ts:29](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionFilter.ts#L29)

Parameters used to filter and validate collections imported from a file tree.

## Type Parameters

### T

`T` *extends* `string`

## Properties

### errorOnInvalidName?

> `readonly` `optional` **errorOnInvalidName**: `boolean`

Defined in: [ts-chocolate/src/packlets/library-data/collectionFilter.ts:41](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionFilter.ts#L41)

***

### excluded?

> `readonly` `optional` **excluded**: readonly [`FilterPattern`](../type-aliases/FilterPattern.md)[]

Defined in: [ts-chocolate/src/packlets/library-data/collectionFilter.ts:39](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionFilter.ts#L39)

Patterns to exclude. Names matching any pattern are excluded (takes precedence over included).
Strings are matched exactly, RegExp patterns use `.test()`.

***

### included?

> `readonly` `optional` **included**: readonly [`FilterPattern`](../type-aliases/FilterPattern.md)[]

Defined in: [ts-chocolate/src/packlets/library-data/collectionFilter.ts:34](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionFilter.ts#L34)

Patterns to include. If specified, only names matching at least one pattern are included.
Strings are matched exactly, RegExp patterns use `.test()`.

***

### nameConverter

> `readonly` **nameConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\> \| [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\>

Defined in: [ts-chocolate/src/packlets/library-data/collectionFilter.ts:40](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionFilter.ts#L40)
