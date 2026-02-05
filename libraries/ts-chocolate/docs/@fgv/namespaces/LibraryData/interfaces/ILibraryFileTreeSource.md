[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / ILibraryFileTreeSource

# Interface: ILibraryFileTreeSource

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:347](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/model.ts#L347)

Specifies a file tree source for the full library (all sub-libraries).

Navigates to standard paths (data/ingredients, data/recipes) within the tree
and loads collections according to the specified load spec.

## Properties

### directory

> `readonly` **directory**: [`IFileTreeDirectoryItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:352](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/model.ts#L352)

Root directory of the library tree.
The loader will navigate to sub-paths like 'data/ingredients' and 'data/recipes'.

***

### load?

> `readonly` `optional` **load**: [`FullLibraryLoadSpec`](../type-aliases/FullLibraryLoadSpec.md)

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:358](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/model.ts#L358)

Which sub-libraries to load from this source.
Default: true (load all sub-libraries)

***

### mutable?

> `readonly` `optional` **mutable**: [`MutabilitySpec`](../type-aliases/MutabilitySpec.md)

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:364](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/model.ts#L364)

Mutability specification for collections from this source.
Default: false (all collections immutable)
