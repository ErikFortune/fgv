[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Editing](../README.md) / IImportOptions

# Interface: IImportOptions

Defined in: [ts-chocolate/src/packlets/editing/model.ts:348](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/editing/model.ts#L348)

Options for importing collections.

## Properties

### newCollectionId?

> `readonly` `optional` **newCollectionId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/editing/model.ts:361](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/editing/model.ts#L361)

New collection ID when using 'create-new' mode.
Required if onCollisionMode is 'create-new'.

***

### onCollisionMode

> `readonly` **onCollisionMode**: `"replace"` \| `"fail"` \| `"create-new"`

Defined in: [ts-chocolate/src/packlets/editing/model.ts:355](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/editing/model.ts#L355)

How to handle existing collection with same ID.
- 'replace': Replace existing collection
- 'create-new': Create new collection with different ID
- 'fail': Fail if collection exists
