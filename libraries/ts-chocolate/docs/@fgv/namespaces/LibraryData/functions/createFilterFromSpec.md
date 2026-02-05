[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / createFilterFromSpec

# Function: createFilterFromSpec()

> **createFilterFromSpec**\<`TCollectionId`\>(`filterSpec`, `nameConverter`): [`CollectionFilter`](../classes/CollectionFilter.md)\<`TCollectionId`\>

Defined in: [ts-chocolate/src/packlets/library-data/collectionFilter.ts:223](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionFilter.ts#L223)

Creates a CollectionFilter from a LibraryLoadSpec.

This helper provides a consistent way to convert the various forms of
LibraryLoadSpec into a properly configured CollectionFilter.

## Type Parameters

### TCollectionId

`TCollectionId` *extends* `string`

## Parameters

### filterSpec

[`LibraryLoadSpec`](../type-aliases/LibraryLoadSpec.md)\<`TCollectionId`\>

The filter specification (true, false, array of IDs, or ILibraryLoadParams)

### nameConverter

Converter for validating collection names

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCollectionId`, `unknown`\> | [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCollectionId`, `unknown`\>

## Returns

[`CollectionFilter`](../classes/CollectionFilter.md)\<`TCollectionId`\>

A CollectionFilter configured according to the spec
