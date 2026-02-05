[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / LibraryLoadSpec

# Type Alias: LibraryLoadSpec\<TCollectionId\>

> **LibraryLoadSpec**\<`TCollectionId`\> = `boolean` \| `ReadonlyArray`\<`TCollectionId`\> \| [`ILibraryLoadParams`](../interfaces/ILibraryLoadParams.md)

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:162](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/model.ts#L162)

Specifies which collections from a library should be loaded.

- `true`: Load all collections (default).
- `false`: Load no collections.
- `ReadonlyArray<TCollectionId>`: Load only the specified collections by name.
- `ILibraryLoadParams`: Fine-grained control using include/exclude patterns.

## Type Parameters

### TCollectionId

`TCollectionId` *extends* `string` = `string`
