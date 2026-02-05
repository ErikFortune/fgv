[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IProducedMoldedBonBonEntity

# Interface: IProducedMoldedBonBonEntity

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:581](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L581)

Produced molded bonbon with concrete choices.

## Extends

- [`IProducedConfectionEntityBase`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md)

## Properties

### confectionType

> `readonly` **confectionType**: `"molded-bonbon"`

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:583](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L583)

Confection type discriminator

#### Overrides

[`IProducedConfectionEntityBase`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md).[`confectionType`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md#confectiontype)

***

### decorationChocolateId?

> `readonly` `optional` **decorationChocolateId**: [`IngredientId`](../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:591](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L591)

Resolved decoration chocolate ingredient ID (if used)

***

### fillings?

> `readonly` `optional` **fillings**: readonly [`AnyResolvedFillingSlotEntity`](../namespaces/Confections/type-aliases/AnyResolvedFillingSlotEntity.md)[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:570](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L570)

Resolved filling slots with concrete selections

#### Inherited from

[`IProducedConfectionEntityBase`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md).[`fillings`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md#fillings)

***

### moldId

> `readonly` **moldId**: [`MoldId`](../../../../type-aliases/MoldId.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:585](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L585)

Resolved mold ID

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:574](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L574)

Optional categorized notes about production

#### Inherited from

[`IProducedConfectionEntityBase`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md).[`notes`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md#notes)

***

### procedureId?

> `readonly` `optional` **procedureId**: [`ProcedureId`](../../../../type-aliases/ProcedureId.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:572](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L572)

Resolved procedure ID if one was used

#### Inherited from

[`IProducedConfectionEntityBase`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md).[`procedureId`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md#procedureid)

***

### sealChocolateId?

> `readonly` `optional` **sealChocolateId**: [`IngredientId`](../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:589](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L589)

Resolved seal chocolate ingredient ID (if used)

***

### shellChocolateId

> `readonly` **shellChocolateId**: [`IngredientId`](../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:587](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L587)

Resolved shell chocolate ingredient ID

***

### versionId

> `readonly` **versionId**: [`ConfectionVersionId`](../../../../type-aliases/ConfectionVersionId.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:566](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L566)

Confection version ID that was produced

#### Inherited from

[`IProducedConfectionEntityBase`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md).[`versionId`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md#versionid)

***

### yield

> `readonly` **yield**: [`IConfectionYield`](IConfectionYield.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:568](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L568)

Yield specification for this production

#### Inherited from

[`IProducedConfectionEntityBase`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md).[`yield`](../namespaces/Confections/interfaces/IProducedConfectionEntityBase.md#yield)
