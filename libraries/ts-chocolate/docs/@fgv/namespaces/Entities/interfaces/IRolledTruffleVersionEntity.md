[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IRolledTruffleVersionEntity

# Interface: IRolledTruffleVersionEntity

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:311](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L311)

Version interface for rolled truffle confections.
Includes enrobing and coating specifications.

## Extends

- [`IConfectionVersionEntityBase`](../namespaces/Confections/interfaces/IConfectionVersionEntityBase.md)

## Properties

### additionalTags?

> `readonly` `optional` **additionalTags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:273](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L273)

Additional tags (merged with base confection tags)

#### Inherited from

[`IConfectionVersionEntityBase`](../namespaces/Confections/interfaces/IConfectionVersionEntityBase.md).[`additionalTags`](../namespaces/Confections/interfaces/IConfectionVersionEntityBase.md#additionaltags)

***

### additionalUrls?

> `readonly` `optional` **additionalUrls**: readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:275](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L275)

Additional URLs (merged with base confection URLs)

#### Inherited from

[`IConfectionVersionEntityBase`](../namespaces/Confections/interfaces/IConfectionVersionEntityBase.md).[`additionalUrls`](../namespaces/Confections/interfaces/IConfectionVersionEntityBase.md#additionalurls)

***

### coatings?

> `readonly` `optional` **coatings**: [`ICoatingsEntity`](../namespaces/Confections/type-aliases/ICoatingsEntity.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:315](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L315)

Optional coatings (cocoa powder, nuts, etc.)

***

### createdDate

> `readonly` **createdDate**: `string`

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:261](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L261)

Date this version was created (ISO 8601 format)

#### Inherited from

[`IConfectionVersionEntityBase`](../namespaces/Confections/interfaces/IConfectionVersionEntityBase.md).[`createdDate`](../namespaces/Confections/interfaces/IConfectionVersionEntityBase.md#createddate)

***

### decorations?

> `readonly` `optional` **decorations**: readonly [`IConfectionDecoration`](../namespaces/Confections/interfaces/IConfectionDecoration.md)[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:267](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L267)

Optional decorations for this version

#### Inherited from

[`IConfectionVersionEntityBase`](../namespaces/Confections/interfaces/IConfectionVersionEntityBase.md).[`decorations`](../namespaces/Confections/interfaces/IConfectionVersionEntityBase.md#decorations)

***

### enrobingChocolate?

> `readonly` `optional` **enrobingChocolate**: [`IChocolateSpec`](../namespaces/Confections/type-aliases/IChocolateSpec.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:313](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L313)

Optional enrobing chocolate specification

***

### fillings?

> `readonly` `optional` **fillings**: readonly [`IFillingSlotEntity`](../namespaces/Confections/interfaces/IFillingSlotEntity.md)[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:265](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L265)

Optional filling slots - each slot has independent options with a preferred selection

#### Inherited from

[`IConfectionVersionEntityBase`](../namespaces/Confections/interfaces/IConfectionVersionEntityBase.md).[`fillings`](../namespaces/Confections/interfaces/IConfectionVersionEntityBase.md#fillings)

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:271](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L271)

Optional categorized notes about this version

#### Inherited from

[`IConfectionVersionEntityBase`](../namespaces/Confections/interfaces/IConfectionVersionEntityBase.md).[`notes`](../namespaces/Confections/interfaces/IConfectionVersionEntityBase.md#notes)

***

### procedures?

> `readonly` `optional` **procedures**: [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IProcedureRefEntity`](../namespaces/Fillings/type-aliases/IProcedureRefEntity.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\>

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:269](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L269)

Optional procedures with preferred selection

#### Inherited from

[`IConfectionVersionEntityBase`](../namespaces/Confections/interfaces/IConfectionVersionEntityBase.md).[`procedures`](../namespaces/Confections/interfaces/IConfectionVersionEntityBase.md#procedures)

***

### versionSpec

> `readonly` **versionSpec**: [`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:259](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L259)

Unique identifier for this version

#### Inherited from

[`IConfectionVersionEntityBase`](../namespaces/Confections/interfaces/IConfectionVersionEntityBase.md).[`versionSpec`](../namespaces/Confections/interfaces/IConfectionVersionEntityBase.md#versionspec)

***

### yield

> `readonly` **yield**: [`IConfectionYield`](IConfectionYield.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:263](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L263)

Yield specification for this version

#### Inherited from

[`IConfectionVersionEntityBase`](../namespaces/Confections/interfaces/IConfectionVersionEntityBase.md).[`yield`](../namespaces/Confections/interfaces/IConfectionVersionEntityBase.md#yield)
