[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / IFileTreeSource

# Interface: IFileTreeSource\<TCollectionId\>

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:315](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-data/model.ts#L315)

Specifies a file tree source for a single sub-library (ingredients or recipes).

This is the common base type for sub-library-specific file tree sources.
Each sub-library navigates to its standard path within the tree and
loads collections according to the load spec.

## Type Parameters

### TCollectionId

`TCollectionId` *extends* `string` = `string`

The type of collection identifiers (defaults to SourceId)

## Properties

### directory

> `readonly` **directory**: [`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:320](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-data/model.ts#L320)

Root directory of the library tree.
The loader will navigate to the appropriate sub-path (e.g., 'data/ingredients' or 'data/recipes').

***

### load?

> `readonly` `optional` **load**: [`LibraryLoadSpec`](../type-aliases/LibraryLoadSpec.md)\<`TCollectionId`\>

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:330](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-data/model.ts#L330)

Controls which collections to load from this source.

- `true` (default): Load all collections.
- `false`: Load no collections.
- `TCollectionId[]`: Load only the specified collections by name.
- `ILibraryLoadParams`: Fine-grained control using include/exclude patterns.

***

### mutable?

> `readonly` `optional` **mutable**: [`MutabilitySpec`](../type-aliases/MutabilitySpec.md)

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:336](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-data/model.ts#L336)

Mutability specification for collections from this source.
Default: false (all collections immutable)
