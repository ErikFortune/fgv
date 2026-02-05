[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / ICollectionSourceMetadata

# Interface: ICollectionSourceMetadata

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:77](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L77)

Optional metadata for collection source files.
When present in source files, provides additional information about the collection.

## Properties

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:92](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L92)

Description of the collection's purpose/contents.

***

### name?

> `readonly` `optional` **name**: `string`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:87](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L87)

Human-readable name for the collection.

***

### secretName?

> `readonly` `optional` **secretName**: `string`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:82](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L82)

Secret name for encryption/decryption.
If provided, the publish command uses this to look up the encryption key.

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:102](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L102)

Tags for categorization/search.

***

### version?

> `readonly` `optional` **version**: `string`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:97](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L97)

Version identifier for the collection.
