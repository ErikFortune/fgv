[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / ICollectionSourceFile

# Interface: ICollectionSourceFile\<T\>

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:109](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/model.ts#L109)

Structure of collection source files (YAML/JSON).

## Type Parameters

### T

`T` = [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

## Properties

### items

> `readonly` **items**: `Record`\<`string`, `T`\>

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:118](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/model.ts#L118)

The actual collection items, keyed by item ID.

***

### metadata?

> `readonly` `optional` **metadata**: [`ICollectionSourceMetadata`](ICollectionSourceMetadata.md)

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:113](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/model.ts#L113)

Optional metadata about the collection.
