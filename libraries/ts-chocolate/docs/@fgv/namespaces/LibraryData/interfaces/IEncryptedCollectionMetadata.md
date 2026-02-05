[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / IEncryptedCollectionMetadata

# Interface: IEncryptedCollectionMetadata

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:34](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-data/model.ts#L34)

Optional unencrypted metadata for encrypted collection files.
Allows filtering/display without decryption.

## Properties

### collectionId?

> `readonly` `optional` **collectionId**: `string`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:38](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-data/model.ts#L38)

Collection ID (unencrypted for filtering/display).

***

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:43](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-data/model.ts#L43)

Human-readable description.

***

### itemCount?

> `readonly` `optional` **itemCount**: `number`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:48](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-data/model.ts#L48)

Number of items in the collection.
