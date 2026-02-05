[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryData](../../../README.md) / [Converters](../README.md) / ICollectionConverterParams

# Interface: ICollectionConverterParams\<TCOLLECTIONID, TITEMID, TITEM\>

Defined in: [ts-chocolate/src/packlets/library-data/converters.ts:104](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/converters.ts#L104)

Initialization parameters for the [collection](../functions/collection.md) converter.

## Type Parameters

### TCOLLECTIONID

`TCOLLECTIONID` *extends* `string`

### TITEMID

`TITEMID` *extends* `string`

### TITEM

`TITEM`

## Properties

### collectionIdConverter

> **collectionIdConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCOLLECTIONID`\>

Defined in: [ts-chocolate/src/packlets/library-data/converters.ts:105](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/converters.ts#L105)

***

### itemConverter

> **itemConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TITEM`, `unknown`\> \| [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TITEM`, `unknown`\>

Defined in: [ts-chocolate/src/packlets/library-data/converters.ts:106](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/converters.ts#L106)

***

### itemIdConverter

> **itemIdConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TITEMID`, `unknown`\> \| [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TITEMID`, `unknown`\>

Defined in: [ts-chocolate/src/packlets/library-data/converters.ts:107](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/converters.ts#L107)
