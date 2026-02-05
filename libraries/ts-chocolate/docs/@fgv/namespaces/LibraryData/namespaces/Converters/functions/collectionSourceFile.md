[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryData](../../../README.md) / [Converters](../README.md) / collectionSourceFile

# Function: collectionSourceFile()

> **collectionSourceFile**\<`T`\>(`itemConverter`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceFile`](../../../interfaces/ICollectionSourceFile.md)\<`T`\>\>

Defined in: [ts-chocolate/src/packlets/library-data/converters.ts:88](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/converters.ts#L88)

Creates a converter for collection source files with the new format.

## Type Parameters

### T

`T`

## Parameters

### itemConverter

Converter or validator for individual items.

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\> | [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\>

## Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceFile`](../../../interfaces/ICollectionSourceFile.md)\<`T`\>\>

Converter for the source file format.
