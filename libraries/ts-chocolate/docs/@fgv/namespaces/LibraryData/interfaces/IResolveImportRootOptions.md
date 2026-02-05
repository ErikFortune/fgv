[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / IResolveImportRootOptions

# Interface: IResolveImportRootOptions

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:582](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/model.ts#L582)

Options for importing a directory for a specific sub-library.

## Properties

### allowLooseFiles?

> `readonly` `optional` **allowLooseFiles**: `boolean`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:590](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/model.ts#L590)

Whether to treat loose *.json/*.yaml/*.yml files in a directory as collections. Default: true

***

### matchLimit?

> `readonly` `optional` **matchLimit**: `number`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:588](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/model.ts#L588)

Maximum candidate matches to count before stopping. Default: 10

***

### maxDepth?

> `readonly` `optional` **maxDepth**: `number`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:584](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/model.ts#L584)

Maximum directory depth to search beneath the provided root. Default: 2

***

### visitLimit?

> `readonly` `optional` **visitLimit**: `number`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:586](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-data/model.ts#L586)

Maximum directories to visit. Default: 800
