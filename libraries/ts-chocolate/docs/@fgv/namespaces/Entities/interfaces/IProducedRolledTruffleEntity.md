[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IProducedRolledTruffleEntity

# Interface: IProducedRolledTruffleEntity

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:609](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L609)

Produced rolled truffle with concrete choices.

## Extends

- [`IProducedConfectionEntityBase`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md)

## Properties

### coatingId?

> `readonly` `optional` **coatingId**: [`IngredientId`](../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:615](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L615)

Resolved coating ingredient ID (if used)

***

### confectionType

> `readonly` **confectionType**: `"rolled-truffle"`

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:611](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L611)

Confection type discriminator

#### Overrides

[`IProducedConfectionEntityBase`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md).[`confectionType`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md#confectiontype)

***

### enrobingChocolateId?

> `readonly` `optional` **enrobingChocolateId**: [`IngredientId`](../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:613](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L613)

Resolved enrobing chocolate ingredient ID (if used)

***

### fillings?

> `readonly` `optional` **fillings**: readonly [`AnyResolvedFillingSlotEntity`](../namespaces/Confections/type-aliases/AnyResolvedFillingSlotEntity.md)[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:570](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L570)

Resolved filling slots with concrete selections

#### Inherited from

[`IProducedConfectionEntityBase`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md).[`fillings`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md#fillings)

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:574](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L574)

Optional categorized notes about production

#### Inherited from

[`IProducedConfectionEntityBase`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md).[`notes`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md#notes)

***

### procedureId?

> `readonly` `optional` **procedureId**: [`ProcedureId`](../../../../type-aliases/ProcedureId.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:572](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L572)

Resolved procedure ID if one was used

#### Inherited from

[`IProducedConfectionEntityBase`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md).[`procedureId`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md#procedureid)

***

### versionId

> `readonly` **versionId**: [`ConfectionVersionId`](../../../../type-aliases/ConfectionVersionId.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:566](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L566)

Confection version ID that was produced

#### Inherited from

[`IProducedConfectionEntityBase`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md).[`versionId`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md#versionid)

***

### yield

> `readonly` **yield**: [`IConfectionYield`](IConfectionYield.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:568](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L568)

Yield specification for this production

#### Inherited from

[`IProducedConfectionEntityBase`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md).[`yield`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md#yield)
