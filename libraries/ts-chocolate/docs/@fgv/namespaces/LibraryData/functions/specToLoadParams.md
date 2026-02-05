[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / specToLoadParams

# Function: specToLoadParams()

> **specToLoadParams**\<`TCollectionId`\>(`spec`, `mutable`): [`ILoadCollectionFromFileTreeParams`](../interfaces/ILoadCollectionFromFileTreeParams.md)\<`TCollectionId`\> \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-data/libraryLoader.ts:54](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/libraryLoader.ts#L54)

Converts a LibraryLoadSpec to ILoadCollectionFromFileTreeParams.

## Type Parameters

### TCollectionId

`TCollectionId` *extends* `string`

## Parameters

### spec

[`LibraryLoadSpec`](../type-aliases/LibraryLoadSpec.md)\<`TCollectionId`\>

The LibraryLoadSpec to convert

### mutable

[`MutabilitySpec`](../type-aliases/MutabilitySpec.md) = `false`

Mutability specification (default: false)

## Returns

[`ILoadCollectionFromFileTreeParams`](../interfaces/ILoadCollectionFromFileTreeParams.md)\<`TCollectionId`\> \| `undefined`

The loading parameters, or undefined if no collections should be loaded
