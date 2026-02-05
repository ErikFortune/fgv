[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IBarTruffleVersion

# Interface: IBarTruffleVersion

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1497](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1497)

Runtime confection version narrowed to bar truffle type.

## Extends

- [`IConfectionVersionBase`](IConfectionVersionBase.md)\<[`IBarTruffle`](IBarTruffle.md), [`IBarTruffleVersionEntity`](../../Entities/interfaces/IBarTruffleVersionEntity.md)\>

## Properties

### confection

> `readonly` **confection**: [`IBarTruffle`](IBarTruffle.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1403](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1403)

The parent confection - resolved.
Enables navigation: `version.confection.name`

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`confection`](IConfectionVersionBase.md#confection)

***

### confectionId

> `readonly` **confectionId**: [`ConfectionId`](../../../../type-aliases/ConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1397](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1397)

The parent confection ID.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`confectionId`](IConfectionVersionBase.md#confectionid)

***

### createdDate

> `readonly` **createdDate**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1392](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1392)

Date this version was created (ISO 8601 format).

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`createdDate`](IConfectionVersionBase.md#createddate)

***

### decorations?

> `readonly` `optional` **decorations**: readonly [`IConfectionDecoration`](../../Entities/namespaces/Confections/interfaces/IConfectionDecoration.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1415](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1415)

Optional decorations for this version.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`decorations`](IConfectionVersionBase.md#decorations)

***

### effectiveTags

> `readonly` **effectiveTags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1441](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1441)

Effective tags for this version (base confection tags + version's additional tags).

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`effectiveTags`](IConfectionVersionBase.md#effectivetags)

***

### effectiveUrls

> `readonly` **effectiveUrls**: readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1446](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1446)

Effective URLs for this version (base confection URLs + version's additional URLs).

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`effectiveUrls`](IConfectionVersionBase.md#effectiveurls)

***

### enrobingChocolate?

> `readonly` `optional` **enrobingChocolate**: [`IResolvedChocolateSpec`](IResolvedChocolateSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1506](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1506)

Resolved enrobing chocolate specification (optional)

***

### entity

> `readonly` **entity**: [`IBarTruffleVersionEntity`](../../Entities/interfaces/IBarTruffleVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1468](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1468)

Gets the underlying recipe version entity data.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`entity`](IConfectionVersionBase.md#entity)

***

### fillings?

> `readonly` `optional` **fillings**: readonly [`IResolvedFillingSlot`](IResolvedFillingSlot.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1428](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1428)

Resolved filling slots for this version.
Undefined if the version has no fillings.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`fillings`](IConfectionVersionBase.md#fillings)

***

### frameDimensions

> `readonly` **frameDimensions**: [`IFrameDimensions`](../../Entities/namespaces/Confections/interfaces/IFrameDimensions.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1500](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1500)

Frame dimensions for ganache slab

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1420](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1420)

Optional notes about this version.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`notes`](IConfectionVersionBase.md#notes)

***

### preferredProcedure

> `readonly` **preferredProcedure**: [`IResolvedConfectionProcedure`](IResolvedConfectionProcedure.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1509](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1509)

Gets the preferred procedure, falling back to first available

***

### procedures?

> `readonly` `optional` **procedures**: [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1434](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1434)

Resolved procedures for this version.
Undefined if the version has no procedures.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`procedures`](IConfectionVersionBase.md#procedures)

***

### singleBonBonDimensions

> `readonly` **singleBonBonDimensions**: [`IBonBonDimensions`](../../Entities/namespaces/Confections/interfaces/IBonBonDimensions.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1503](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1503)

Single bonbon dimensions for cutting

***

### versionSpec

> `readonly` **versionSpec**: [`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1387](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1387)

Version specifier for this version.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`versionSpec`](IConfectionVersionBase.md#versionspec)

***

### yield

> `readonly` **yield**: [`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1410](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1410)

Yield specification for this version.

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`yield`](IConfectionVersionBase.md#yield)

## Methods

### isBarTruffleVersion()

> **isBarTruffleVersion**(): `this is IBarTruffleVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1458](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1458)

Returns true if this is a bar truffle version.

#### Returns

`this is IBarTruffleVersion`

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`isBarTruffleVersion`](IConfectionVersionBase.md#isbartruffleversion)

***

### isMoldedBonBonVersion()

> **isMoldedBonBonVersion**(): `this is IMoldedBonBonVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1453](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1453)

Returns true if this is a molded bonbon version.

#### Returns

`this is IMoldedBonBonVersion`

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`isMoldedBonBonVersion`](IConfectionVersionBase.md#ismoldedbonbonversion)

***

### isRolledTruffleVersion()

> **isRolledTruffleVersion**(): `this is IRolledTruffleVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1463](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1463)

Returns true if this is a rolled truffle version.

#### Returns

`this is IRolledTruffleVersion`

#### Inherited from

[`IConfectionVersionBase`](IConfectionVersionBase.md).[`isRolledTruffleVersion`](IConfectionVersionBase.md#isrolledtruffleversion)
