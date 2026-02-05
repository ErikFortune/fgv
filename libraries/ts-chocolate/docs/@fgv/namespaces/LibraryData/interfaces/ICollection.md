[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / ICollection

# Interface: ICollection\<T, TCOLLECTIONID, TITEMID\>

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:182](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-data/model.ts#L182)

Representation of a collection of items as serialized data.
This is the base data interface without runtime-only properties.

## Extended by

- [`IRuntimeCollection`](IRuntimeCollection.md)

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

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:187](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-data/model.ts#L187)

***

### isMutable

> `readonly` **isMutable**: `boolean`

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:192](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-data/model.ts#L192)

Whether this collection is mutable (can be edited in the application).
This is application-level mutability controlled by MutabilitySpec.

***

### items

> `readonly` **items**: `Record`\<`TITEMID`, `T`\>

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:193](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-data/model.ts#L193)

***

### metadata?

> `readonly` `optional` **metadata**: [`ICollectionSourceMetadata`](ICollectionSourceMetadata.md)

Defined in: [ts-chocolate/src/packlets/library-data/model.ts:198](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-data/model.ts#L198)

Optional metadata from the source file.
May be undefined for collections created programmatically.
