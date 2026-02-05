[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryData](../../../README.md) / [Converters](../README.md) / collection

# Function: collection()

> **collection**\<`TCOLLECTIONID`, `TITEMID`, `TITEM`\>(`params`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollection`](../../../interfaces/ICollection.md)\<`TITEM`, `TCOLLECTIONID`, `TITEMID`\>\>

Defined in: [ts-chocolate/src/packlets/library-data/converters.ts:117](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/converters.ts#L117)

Returns a converter that validates a [collection](../../../interfaces/ICollection.md) using the supplied converters.

## Type Parameters

### TCOLLECTIONID

`TCOLLECTIONID` *extends* `string`

### TITEMID

`TITEMID` *extends* `string`

### TITEM

`TITEM`

## Parameters

### params

[`ICollectionConverterParams`](../interfaces/ICollectionConverterParams.md)\<`TCOLLECTIONID`, `TITEMID`, `TITEM`\>

[Collection converter constructor parameters](../interfaces/ICollectionConverterParams.md)
which specify the converters to use.

## Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollection`](../../../interfaces/ICollection.md)\<`TITEM`, `TCOLLECTIONID`, `TITEMID`\>\>

The collection converter.
