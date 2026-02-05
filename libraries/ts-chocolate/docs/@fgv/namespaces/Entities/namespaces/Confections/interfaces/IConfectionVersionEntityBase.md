[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Confections](../README.md) / IConfectionVersionEntityBase

# Interface: IConfectionVersionEntityBase

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:257](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L257)

Base version interface - shared by all confection version types.
Contains the configuration details that can change between versions.

## Extended by

- [`IBarTruffleVersionEntity`](../../../interfaces/IBarTruffleVersionEntity.md)
- [`IMoldedBonBonVersionEntity`](../../../interfaces/IMoldedBonBonVersionEntity.md)
- [`IRolledTruffleVersionEntity`](../../../interfaces/IRolledTruffleVersionEntity.md)

## Properties

### additionalTags?

> `readonly` `optional` **additionalTags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:273](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L273)

Additional tags (merged with base confection tags)

***

### additionalUrls?

> `readonly` `optional` **additionalUrls**: readonly [`ICategorizedUrl`](../../../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:275](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L275)

Additional URLs (merged with base confection URLs)

***

### createdDate

> `readonly` **createdDate**: `string`

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:261](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L261)

Date this version was created (ISO 8601 format)

***

### decorations?

> `readonly` `optional` **decorations**: readonly [`IConfectionDecoration`](IConfectionDecoration.md)[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:267](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L267)

Optional decorations for this version

***

### fillings?

> `readonly` `optional` **fillings**: readonly [`IFillingSlotEntity`](IFillingSlotEntity.md)[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:265](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L265)

Optional filling slots - each slot has independent options with a preferred selection

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:271](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L271)

Optional categorized notes about this version

***

### procedures?

> `readonly` `optional` **procedures**: [`IOptionsWithPreferred`](../../../../Model/interfaces/IOptionsWithPreferred.md)\<[`IProcedureRefEntity`](../../Fillings/type-aliases/IProcedureRefEntity.md), [`ProcedureId`](../../../../../../type-aliases/ProcedureId.md)\>

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:269](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L269)

Optional procedures with preferred selection

***

### versionSpec

> `readonly` **versionSpec**: [`ConfectionVersionSpec`](../../../../../../type-aliases/ConfectionVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:259](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L259)

Unique identifier for this version

***

### yield

> `readonly` **yield**: [`IConfectionYield`](../../../interfaces/IConfectionYield.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:263](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L263)

Yield specification for this version
