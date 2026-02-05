[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryData](../../../README.md) / [Converters](../README.md) / collectionJsonConverter

# Function: collectionJsonConverter()

> **collectionJsonConverter**\<`T`\>(`itemConverter`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceFile`](../../../interfaces/ICollectionSourceFile.md)\<`T`\>\>

Defined in: [ts-chocolate/src/packlets/library-data/converters.ts:179](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/converters.ts#L179)

Creates a converter for JSON collection source files.
Parses JSON string content and validates as a collection source file.

## Type Parameters

### T

`T`

## Parameters

### itemConverter

Converter for individual collection items

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\> | [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\>

## Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceFile`](../../../interfaces/ICollectionSourceFile.md)\<`T`\>\>

Converter that parses JSON and validates as collection
