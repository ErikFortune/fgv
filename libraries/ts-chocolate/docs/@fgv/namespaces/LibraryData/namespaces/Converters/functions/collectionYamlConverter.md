[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryData](../../../README.md) / [Converters](../README.md) / collectionYamlConverter

# Function: collectionYamlConverter()

> **collectionYamlConverter**\<`T`\>(`itemConverter`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceFile`](../../../interfaces/ICollectionSourceFile.md)\<`T`\>\>

Defined in: [ts-chocolate/src/packlets/library-data/converters.ts:166](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-data/converters.ts#L166)

Creates a converter for YAML collection source files.
Parses YAML string content and validates as a collection source file.

## Type Parameters

### T

`T`

## Parameters

### itemConverter

Converter for individual collection items

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\> | [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\>

## Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceFile`](../../../interfaces/ICollectionSourceFile.md)\<`T`\>\>

Converter that parses YAML and validates as collection
