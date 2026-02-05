[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / IResolveImportRootOptions

# Interface: IResolveImportRootOptions

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:582](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L582)

Options for importing a directory for a specific sub-library.

## Properties

### allowLooseFiles?

> `readonly` `optional` **allowLooseFiles**: `boolean`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:590](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L590)

Whether to treat loose *.json/*.yaml/*.yml files in a directory as collections. Default: true

***

### matchLimit?

> `readonly` `optional` **matchLimit**: `number`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:588](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L588)

Maximum candidate matches to count before stopping. Default: 10

***

### maxDepth?

> `readonly` `optional` **maxDepth**: `number`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:584](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L584)

Maximum directory depth to search beneath the provided root. Default: 2

***

### visitLimit?

> `readonly` `optional` **visitLimit**: `number`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:586](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L586)

Maximum directories to visit. Default: 800
