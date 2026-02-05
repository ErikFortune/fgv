[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IRolledTruffleVersion

# Interface: IRolledTruffleVersion

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1523](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1523)

Runtime confection version narrowed to rolled truffle type.

## Extends

- [`IConfectionVersionBase`](IConfectionVersionBase.md)\<[`IRolledTruffle`](IRolledTruffle.md), [`IRolledTruffleVersionEntity`](../../Entities/interfaces/IRolledTruffleVersionEntity.md)\>

## Properties

### coatings?

> `readonly` `optional` **coatings**: [`IResolvedCoatings`](IResolvedCoatings.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1530](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1530)

Resolved coatings (optional)

***

### confection

> `readonly` **confection**: [`IRolledTruffle`](IRolledTruffle.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1408](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1408)

The parent confection - resolved.
Enables navigation: `version.confection.name`

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`confection`](IConfectionVersionBase.md#confection)

***

### confectionId

> `readonly` **confectionId**: [`ConfectionId`](../../../../type-aliases/ConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1402](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1402)

The parent confection ID.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`confectionId`](IConfectionVersionBase.md#confectionid)

***

### createdDate

> `readonly` **createdDate**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1397](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1397)

Date this version was created (ISO 8601 format).

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`createdDate`](IConfectionVersionBase.md#createddate)

***

### decorations?

> `readonly` `optional` **decorations**: readonly [`IConfectionDecoration`](../../Entities/namespaces/Confections/interfaces/IConfectionDecoration.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1420](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1420)

Optional decorations for this version.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`decorations`](IConfectionVersionBase.md#decorations)

***

### effectiveTags

> `readonly` **effectiveTags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1446](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1446)

Effective tags for this version (base confection tags + version's additional tags).

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`effectiveTags`](IConfectionVersionBase.md#effectivetags)

***

### effectiveUrls

> `readonly` **effectiveUrls**: readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1451](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1451)

Effective URLs for this version (base confection URLs + version's additional URLs).

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`effectiveUrls`](IConfectionVersionBase.md#effectiveurls)

***

### enrobingChocolate?

> `readonly` `optional` **enrobingChocolate**: [`IResolvedChocolateSpec`](IResolvedChocolateSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1527](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1527)

Resolved enrobing chocolate specification (optional)

***

### entity

> `readonly` **entity**: [`IRolledTruffleVersionEntity`](../../Entities/interfaces/IRolledTruffleVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1473](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1473)

Gets the underlying recipe version entity data.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`entity`](IConfectionVersionBase.md#entity)

***

### fillings?

> `readonly` `optional` **fillings**: readonly [`IResolvedFillingSlot`](IResolvedFillingSlot.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1433](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1433)

Resolved filling slots for this version.
Undefined if the version has no fillings.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`fillings`](IConfectionVersionBase.md#fillings)

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1425](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1425)

Optional notes about this version.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`notes`](IConfectionVersionBase.md#notes)

***

### preferredProcedure

> `readonly` **preferredProcedure**: [`IResolvedConfectionProcedure`](IResolvedConfectionProcedure.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1533](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1533)

Gets the preferred procedure, falling back to first available

***

### procedures?

> `readonly` `optional` **procedures**: [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1439](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1439)

Resolved procedures for this version.
Undefined if the version has no procedures.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`procedures`](IConfectionVersionBase.md#procedures)

***

### versionSpec

> `readonly` **versionSpec**: [`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1392](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1392)

Version specifier for this version.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`versionSpec`](IConfectionVersionBase.md#versionspec)

***

### yield

> `readonly` **yield**: [`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1415](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1415)

Yield specification for this version.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`yield`](IConfectionVersionBase.md#yield)

## Methods

### isBarTruffleVersion()

> **isBarTruffleVersion**(): `this is IBarTruffleVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1463](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1463)

Returns true if this is a bar truffle version.

#### Returns

`this is IBarTruffleVersion`

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`isBarTruffleVersion`](IConfectionVersionBase.md#isbartruffleversion)

***

### isMoldedBonBonVersion()

> **isMoldedBonBonVersion**(): `this is IMoldedBonBonVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1458](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1458)

Returns true if this is a molded bonbon version.

#### Returns

`this is IMoldedBonBonVersion`

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`isMoldedBonBonVersion`](IConfectionVersionBase.md#ismoldedbonbonversion)

***

### isRolledTruffleVersion()

> **isRolledTruffleVersion**(): `this is IRolledTruffleVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1468](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1468)

Returns true if this is a rolled truffle version.

#### Returns

`this is IRolledTruffleVersion`

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`isRolledTruffleVersion`](IConfectionVersionBase.md#isrolledtruffleversion)
