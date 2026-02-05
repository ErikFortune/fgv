[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / IRuntimeCollection

# Interface: IRuntimeCollection\<T, TCOLLECTIONID, TITEMID\>

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:206](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L206)

Runtime representation of a collection loaded from a FileTree.
Extends the base collection data with a reference to the source FileTree item.

## Extends

- [`ICollection`](ICollection.md)\<`T`, `TCOLLECTIONID`, `TITEMID`\>

## Type Parameters

### T

`T` = [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

### TCOLLECTIONID

`TCOLLECTIONID` *extends* `string` = `string`

### TITEMID

`TITEMID` *extends* `string` = `string`

## Properties

### id

> `readonly` **id**: `TCOLLECTIONID`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:187](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L187)

#### Inherited from

[`ICollection`](ICollection.md).[`id`](ICollection.md#id)

***

### isMutable

> `readonly` **isMutable**: `boolean`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:192](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L192)

Whether this collection is mutable (can be edited in the application).
This is application-level mutability controlled by MutabilitySpec.

#### Inherited from

[`ICollection`](ICollection.md).[`isMutable`](ICollection.md#ismutable)

***

### items

> `readonly` **items**: `Record`\<`TITEMID`, `T`\>

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:193](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L193)

#### Inherited from

[`ICollection`](ICollection.md).[`items`](ICollection.md#items)

***

### metadata?

> `readonly` `optional` **metadata**: [`ICollectionSourceMetadata`](ICollectionSourceMetadata.md)

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:198](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L198)

Optional metadata from the source file.
May be undefined for collections created programmatically.

#### Inherited from

[`ICollection`](ICollection.md).[`metadata`](ICollection.md#metadata)

***

### sourceItem

> `readonly` **sourceItem**: [`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:216](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L216)

Reference to the source FileTree item for persistence.
When present and the FileTree supports persistence, changes can be saved back to the file.
This is file-level mutability separate from application-level mutability.
