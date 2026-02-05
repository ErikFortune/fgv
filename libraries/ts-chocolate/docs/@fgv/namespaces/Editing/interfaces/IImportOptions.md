[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Editing](../README.md) / IImportOptions

# Interface: IImportOptions

Defined in: [ts-chocolate/src/packlets/editing/model.ts:348](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/model.ts#L348)

Options for importing collections.

## Properties

### newCollectionId?

> `readonly` `optional` **newCollectionId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/editing/model.ts:361](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/model.ts#L361)

New collection ID when using 'create-new' mode.
Required if onCollisionMode is 'create-new'.

***

### onCollisionMode

> `readonly` **onCollisionMode**: `"replace"` \| `"fail"` \| `"create-new"`

Defined in: [ts-chocolate/src/packlets/editing/model.ts:355](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/model.ts#L355)

How to handle existing collection with same ID.
- 'replace': Replace existing collection
- 'create-new': Create new collection with different ID
- 'fail': Fail if collection exists
