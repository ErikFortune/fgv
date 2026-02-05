[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IConfectionVersionBase

# Interface: IConfectionVersionBase\<TConfection, TEntity\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1383](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1383)

A resolved runtime view of a confection version with resolved references.

This interface provides runtime-layer access to version data with:
- Parent confection reference (ID and resolved object)
- Resolved filling slots and procedures
- Effective tags/urls (merged from base confection + version)
- Access to underlying recipe version entity data

## Extended by

- [`IMoldedBonBonVersion`](IMoldedBonBonVersion.md)
- [`IBarTruffleVersion`](IBarTruffleVersion.md)
- [`IRolledTruffleVersion`](IRolledTruffleVersion.md)

## Type Parameters

### TConfection

`TConfection` *extends* [`IConfectionBase`](IConfectionBase.md) = [`IConfectionBase`](IConfectionBase.md)

The specific confection type for this version

### TEntity

`TEntity` *extends* [`AnyConfectionVersionEntity`](../../Entities/type-aliases/AnyConfectionVersionEntity.md) = [`AnyConfectionVersionEntity`](../../Entities/type-aliases/AnyConfectionVersionEntity.md)

The specific entity type for this version

## Properties

### confection

> `readonly` **confection**: `TConfection`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1408](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1408)

The parent confection - resolved.
Enables navigation: `version.confection.name`

***

### confectionId

> `readonly` **confectionId**: [`ConfectionId`](../../../../type-aliases/ConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1402](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1402)

The parent confection ID.

***

### createdDate

> `readonly` **createdDate**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1397](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1397)

Date this version was created (ISO 8601 format).

***

### decorations?

> `readonly` `optional` **decorations**: readonly [`IConfectionDecoration`](../../Entities/namespaces/Confections/interfaces/IConfectionDecoration.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1420](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1420)

Optional decorations for this version.

***

### effectiveTags

> `readonly` **effectiveTags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1446](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1446)

Effective tags for this version (base confection tags + version's additional tags).

***

### effectiveUrls

> `readonly` **effectiveUrls**: readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1451](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1451)

Effective URLs for this version (base confection URLs + version's additional URLs).

***

### entity

> `readonly` **entity**: `TEntity`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1473](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1473)

Gets the underlying recipe version entity data.

***

### fillings?

> `readonly` `optional` **fillings**: readonly [`IResolvedFillingSlot`](IResolvedFillingSlot.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1433](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1433)

Resolved filling slots for this version.
Undefined if the version has no fillings.

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1425](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1425)

Optional notes about this version.

***

### procedures?

> `readonly` `optional` **procedures**: [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1439](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1439)

Resolved procedures for this version.
Undefined if the version has no procedures.

***

### versionSpec

> `readonly` **versionSpec**: [`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1392](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1392)

Version specifier for this version.

***

### yield

> `readonly` **yield**: [`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1415](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1415)

Yield specification for this version.

## Methods

### isBarTruffleVersion()

> **isBarTruffleVersion**(): `this is IBarTruffleVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1463](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1463)

Returns true if this is a bar truffle version.

#### Returns

`this is IBarTruffleVersion`

***

### isMoldedBonBonVersion()

> **isMoldedBonBonVersion**(): `this is IMoldedBonBonVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1458](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1458)

Returns true if this is a molded bonbon version.

#### Returns

`this is IMoldedBonBonVersion`

***

### isRolledTruffleVersion()

> **isRolledTruffleVersion**(): `this is IRolledTruffleVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1468](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1468)

Returns true if this is a rolled truffle version.

#### Returns

`this is IRolledTruffleVersion`
