[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / ICollectionLoaderInitParams

# Interface: ICollectionLoaderInitParams\<T, TCOLLECTIONID, TITEMID\>

Defined in: [ts-chocolate/src/packlets/library-data/collectionLoader.ts:53](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionLoader.ts#L53)

Parameters used to initialize a [CollectionLoader](../classes/CollectionLoader.md).

## Type Parameters

### T

`T`

### TCOLLECTIONID

`TCOLLECTIONID` *extends* `string` = `string`

### TITEMID

`TITEMID` *extends* `string` = `string`

## Properties

### collectionIdConverter

> `readonly` **collectionIdConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCOLLECTIONID`\>

Defined in: [ts-chocolate/src/packlets/library-data/collectionLoader.ts:59](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionLoader.ts#L59)

***

### fileNameConverter?

> `readonly` `optional` **fileNameConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, `unknown`\>

Defined in: [ts-chocolate/src/packlets/library-data/collectionLoader.ts:65](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionLoader.ts#L65)

Optional converter to transform file names before applying the collection ID converter.
Defaults to [removeJsonExtension](../namespaces/Converters/variables/removeJsonExtension.md).

***

### itemConverter

> `readonly` **itemConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\> \| [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\>

Defined in: [ts-chocolate/src/packlets/library-data/collectionLoader.ts:58](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionLoader.ts#L58)

***

### itemIdConverter

> `readonly` **itemIdConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TITEMID`, `unknown`\> \| [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TITEMID`, `unknown`\>

Defined in: [ts-chocolate/src/packlets/library-data/collectionLoader.ts:60](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionLoader.ts#L60)

***

### logger?

> `readonly` `optional` **logger**: [`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`, `unknown`\>

Defined in: [ts-chocolate/src/packlets/library-data/collectionLoader.ts:75](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionLoader.ts#L75)

Optional logger for reporting loading progress and issues.

***

### mutable?

> `readonly` `optional` **mutable**: [`MutabilitySpec`](../type-aliases/MutabilitySpec.md)

Defined in: [ts-chocolate/src/packlets/library-data/collectionLoader.ts:70](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionLoader.ts#L70)

Default mutability specification for loaded collections.
Defaults to `false` (all collections immutable).
