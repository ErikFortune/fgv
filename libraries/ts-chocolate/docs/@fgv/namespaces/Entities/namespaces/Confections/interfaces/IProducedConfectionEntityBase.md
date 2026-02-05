[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Confections](../README.md) / IProducedConfectionEntityBase

# Interface: IProducedConfectionEntityBase

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:562](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L562)

Base interface for all produced confection types.
Contains common fields shared by all confection productions.

## Extended by

- [`IProducedBarTruffleEntity`](../../../interfaces/IProducedBarTruffleEntity.md)
- [`IProducedMoldedBonBonEntity`](../../../interfaces/IProducedMoldedBonBonEntity.md)
- [`IProducedRolledTruffleEntity`](../../../interfaces/IProducedRolledTruffleEntity.md)

## Properties

### confectionType

> `readonly` **confectionType**: [`ConfectionType`](../../../../../../type-aliases/ConfectionType.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:564](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L564)

Confection type discriminator (matches ConfectionType)

***

### fillings?

> `readonly` `optional` **fillings**: readonly [`AnyResolvedFillingSlotEntity`](../type-aliases/AnyResolvedFillingSlotEntity.md)[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:570](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L570)

Resolved filling slots with concrete selections

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:574](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L574)

Optional categorized notes about production

***

### procedureId?

> `readonly` `optional` **procedureId**: [`ProcedureId`](../../../../../../type-aliases/ProcedureId.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:572](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L572)

Resolved procedure ID if one was used

***

### versionId

> `readonly` **versionId**: [`ConfectionVersionId`](../../../../../../type-aliases/ConfectionVersionId.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:566](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L566)

Confection version ID that was produced

***

### yield

> `readonly` **yield**: [`IConfectionYield`](../../../interfaces/IConfectionYield.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:568](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L568)

Yield specification for this production
