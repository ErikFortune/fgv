[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / specToLoadParams

# Function: specToLoadParams()

> **specToLoadParams**\<`TCollectionId`\>(`spec`, `mutable`): [`ILoadCollectionFromFileTreeParams`](../interfaces/ILoadCollectionFromFileTreeParams.md)\<`TCollectionId`\> \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-data/libraryLoader.ts:54](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/libraryLoader.ts#L54)

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
