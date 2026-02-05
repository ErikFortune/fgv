[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / IProtectedCollectionInfo

# Interface: IProtectedCollectionInfo\<TCollectionId\>

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:464](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L464)

Public reference to a protected (encrypted) collection that was captured
during loading but not decrypted due to missing keys.

Contains only metadata that was stored unencrypted in the collection file.
The actual encrypted data is stored internally for later decryption.

## Type Parameters

### TCollectionId

`TCollectionId` *extends* `string` = `string`

The type of collection identifiers (defaults to string)

## Properties

### collectionId

> `readonly` **collectionId**: `TCollectionId`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:468](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L468)

The collection identifier (derived from filename).

***

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:478](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L478)

Optional human-readable description from unencrypted metadata.

***

### isBuiltIn

> `readonly` **isBuiltIn**: `boolean`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:494](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L494)

Whether this collection is from the built-in library data.
Built-in collections are always immutable.

***

### isMutable

> `readonly` **isMutable**: `boolean`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:488](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L488)

Whether this collection would be mutable once loaded.

***

### itemCount?

> `readonly` `optional` **itemCount**: `number`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:483](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L483)

Optional item count from unencrypted metadata.

***

### keyDerivation?

> `readonly` `optional` **keyDerivation**: [`IKeyDerivationParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:500](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L500)

Optional key derivation parameters from the encrypted file.
If present, allows password-based decryption using these parameters.

***

### secretName

> `readonly` **secretName**: `string`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:473](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-data/model.ts#L473)

The name of the secret required to decrypt this collection.
