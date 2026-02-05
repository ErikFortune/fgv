[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Fillings](../README.md) / IFillingDerivationEntity

# Interface: IFillingDerivationEntity

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:245](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L245)

Reference to a source filling recipe+version from which a filling recipe was derived.
Used to track lineage when a user edits a read-only filling recipe and creates
a new filling recipe in a writable collection.

## Properties

### derivedDate

> `readonly` **derivedDate**: `string`

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:254](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L254)

Date of derivation (ISO 8601 format)

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:259](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L259)

Optional categorized notes about the derivation

***

### sourceVersionId

> `readonly` **sourceVersionId**: [`FillingVersionId`](../../../../../../type-aliases/FillingVersionId.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:249](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L249)

Source filling recipe version ID (format: "sourceId.fillingId@versionSpec")
