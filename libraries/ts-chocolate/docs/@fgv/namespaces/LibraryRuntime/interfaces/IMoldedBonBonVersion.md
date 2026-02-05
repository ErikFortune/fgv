[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IMoldedBonBonVersion

# Interface: IMoldedBonBonVersion

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1509](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1509)

Runtime confection version narrowed to molded bonbon type.

## Extends

- [`IConfectionVersionBase`](IConfectionVersionBase.md)

## Properties

### additionalChocolates?

> `readonly` `optional` **additionalChocolates**: readonly [`IResolvedAdditionalChocolate`](IResolvedAdditionalChocolate.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1520](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1520)

Resolved additional chocolates (optional)

***

### confection

> `readonly` **confection**: [`IMoldedBonBon`](IMoldedBonBon.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1511](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1511)

Parent confection narrowed to molded bonbon type

#### Overrides

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`confection`](IConfectionVersionBase.md#confection)

***

### confectionId

> `readonly` **confectionId**: [`ConfectionId`](../../../../type-aliases/ConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1425](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1425)

The parent confection ID.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`confectionId`](IConfectionVersionBase.md#confectionid)

***

### createdDate

> `readonly` **createdDate**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1420](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1420)

Date this version was created (ISO 8601 format).

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`createdDate`](IConfectionVersionBase.md#createddate)

***

### decorations?

> `readonly` `optional` **decorations**: readonly [`IConfectionDecoration`](../../Entities/namespaces/Confections/interfaces/IConfectionDecoration.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1449](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1449)

Optional decorations for this version.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`decorations`](IConfectionVersionBase.md#decorations)

***

### effectiveTags

> `readonly` **effectiveTags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1475](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1475)

Effective tags for this version (base confection tags + version's additional tags).

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`effectiveTags`](IConfectionVersionBase.md#effectivetags)

***

### effectiveUrls

> `readonly` **effectiveUrls**: readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1480](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1480)

Effective URLs for this version (base confection URLs + version's additional URLs).

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`effectiveUrls`](IConfectionVersionBase.md#effectiveurls)

***

### entity

> `readonly` **entity**: [`IMoldedBonBonVersionEntity`](../../Entities/interfaces/IMoldedBonBonVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1529](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1529)

Entity data typed to [IMoldedBonBonVersionEntity](../../Entities/interfaces/IMoldedBonBonVersionEntity.md).

#### Overrides

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`entity`](IConfectionVersionBase.md#entity)

***

### fillings?

> `readonly` `optional` **fillings**: readonly [`IResolvedFillingSlot`](IResolvedFillingSlot.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1462](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1462)

Resolved filling slots for this version.
Undefined if the version has no fillings.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`fillings`](IConfectionVersionBase.md#fillings)

***

### molds

> `readonly` **molds**: [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionMoldRef`](IResolvedConfectionMoldRef.md), [`MoldId`](../../../../type-aliases/MoldId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1514](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1514)

Resolved molds with preferred selection

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1454](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1454)

Optional notes about this version.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`notes`](IConfectionVersionBase.md#notes)

***

### preferredMold

> `readonly` **preferredMold**: [`IResolvedConfectionMoldRef`](IResolvedConfectionMoldRef.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1523](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1523)

Gets the preferred mold, falling back to first available

***

### preferredProcedure

> `readonly` **preferredProcedure**: [`IResolvedConfectionProcedure`](IResolvedConfectionProcedure.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1526](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1526)

Gets the preferred procedure, falling back to first available

***

### procedures?

> `readonly` `optional` **procedures**: [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1468](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1468)

Resolved procedures for this version.
Undefined if the version has no procedures.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`procedures`](IConfectionVersionBase.md#procedures)

***

### shellChocolate

> `readonly` **shellChocolate**: [`IResolvedChocolateSpec`](IResolvedChocolateSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1517](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1517)

Resolved shell chocolate specification

***

### version

> `readonly` **version**: [`AnyConfectionVersionEntity`](../../Entities/type-aliases/AnyConfectionVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1437](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1437)

The underlying confection version.
Use this to get the version entity data for persistence or journaling.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`version`](IConfectionVersionBase.md#version)

***

### versionSpec

> `readonly` **versionSpec**: [`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1415](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1415)

Version specifier for this version.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`versionSpec`](IConfectionVersionBase.md#versionspec)

***

### yield

> `readonly` **yield**: [`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1444](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1444)

Yield specification for this version.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`yield`](IConfectionVersionBase.md#yield)

## Methods

### isBarTruffleVersion()

> **isBarTruffleVersion**(): `this is IBarTruffleVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1492](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1492)

Returns true if this is a bar truffle version.

#### Returns

`this is IBarTruffleVersion`

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`isBarTruffleVersion`](IConfectionVersionBase.md#isbartruffleversion)

***

### isMoldedBonBonVersion()

> **isMoldedBonBonVersion**(): `this is IMoldedBonBonVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1487](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1487)

Returns true if this is a molded bonbon version.

#### Returns

`this is IMoldedBonBonVersion`

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`isMoldedBonBonVersion`](IConfectionVersionBase.md#ismoldedbonbonversion)

***

### isRolledTruffleVersion()

> **isRolledTruffleVersion**(): `this is IRolledTruffleVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1497](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1497)

Returns true if this is a rolled truffle version.

#### Returns

`this is IRolledTruffleVersion`

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`isRolledTruffleVersion`](IConfectionVersionBase.md#isrolledtruffleversion)
