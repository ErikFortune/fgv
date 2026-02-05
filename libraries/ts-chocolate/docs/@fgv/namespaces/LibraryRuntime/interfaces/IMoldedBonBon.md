[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IMoldedBonBon

# Interface: IMoldedBonBon

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1157](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1157)

Runtime confection narrowed to molded bonbon type.

## Extends

- [`IConfectionBase`](IConfectionBase.md)\<[`IMoldedBonBonVersion`](IMoldedBonBonVersion.md), [`IMoldedBonBonEntity`](../../Entities/interfaces/IMoldedBonBonEntity.md)\>

## Properties

### additionalChocolates?

> `readonly` `optional` **additionalChocolates**: readonly [`IResolvedAdditionalChocolate`](IResolvedAdditionalChocolate.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1169](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1169)

Resolved additional chocolates (from golden version)

***

### baseId

> `readonly` **baseId**: [`BaseConfectionId`](../../../../type-aliases/BaseConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1046](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1046)

The base confection ID within the source.

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`baseId`](IConfectionBase.md#baseid)

***

### collectionId

> `readonly` **collectionId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1041](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1041)

The collection ID part of the composite ID.

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`collectionId`](IConfectionBase.md#collectionid)

***

### confectionType

> `readonly` **confectionType**: `"molded-bonbon"`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1160](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1160)

Type is always 'molded-bonbon' for this confection

#### Overrides

[`IConfectionBase`](IConfectionBase.md).[`confectionType`](IConfectionBase.md#confectiontype)

***

### decorations?

> `readonly` `optional` **decorations**: readonly [`IConfectionDecoration`](../../Entities/namespaces/Confections/interfaces/IConfectionDecoration.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1116](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1116)

Decorations from the golden version

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`decorations`](IConfectionBase.md#decorations)

***

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1057](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1057)

Optional description

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`description`](IConfectionBase.md#description)

***

### effectiveTags

> `readonly` **effectiveTags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1092](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1092)

Gets effective tags for the golden version (base + version's additional tags).

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`effectiveTags`](IConfectionBase.md#effectivetags)

***

### effectiveUrls

> `readonly` **effectiveUrls**: readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1097](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1097)

Gets effective URLs for the golden version (base + version's additional URLs).

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`effectiveUrls`](IConfectionBase.md#effectiveurls)

***

### entity

> `readonly` **entity**: [`IMoldedBonBonEntity`](../../Entities/interfaces/IMoldedBonBonEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1150](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1150)

Gets the underlying confection entity data.

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`entity`](IConfectionBase.md#entity)

***

### fillings?

> `readonly` `optional` **fillings**: readonly [`IResolvedFillingSlot`](IResolvedFillingSlot.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1122](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1122)

Resolved filling slots from the golden version

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`fillings`](IConfectionBase.md#fillings)

***

### goldenVersion

> `readonly` **goldenVersion**: [`IMoldedBonBonVersion`](IMoldedBonBonVersion.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1073](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1073)

The golden (default) version - resolved.

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`goldenVersion`](IConfectionBase.md#goldenversion)

***

### goldenVersionSpec

> `readonly` **goldenVersionSpec**: [`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1066](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1066)

The ID of the golden (approved default) version

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`goldenVersionSpec`](IConfectionBase.md#goldenversionspec)

***

### id

> `readonly` **id**: [`ConfectionId`](../../../../type-aliases/ConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1036](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1036)

The composite confection ID (e.g., "common.dark-dome-bonbon").
Combines source and base ID for unique identification across sources.

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`id`](IConfectionBase.md#id)

***

### molds

> `readonly` **molds**: [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionMoldRef`](IResolvedConfectionMoldRef.md), [`MoldId`](../../../../type-aliases/MoldId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1163](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1163)

Resolved molds with preferred selection (from golden version)

***

### name

> `readonly` **name**: [`ConfectionName`](../../../../type-aliases/ConfectionName.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1054](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1054)

Human-readable name

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`name`](IConfectionBase.md#name)

***

### procedures?

> `readonly` `optional` **procedures**: [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1125](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1125)

Resolved procedures from the golden version

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`procedures`](IConfectionBase.md#procedures)

***

### shellChocolate

> `readonly` **shellChocolate**: [`IResolvedChocolateSpec`](IResolvedChocolateSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1166](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1166)

Resolved shell chocolate specification (from golden version)

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1060](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1060)

Base tags for searching/filtering (version may add more)

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`tags`](IConfectionBase.md#tags)

***

### urls?

> `readonly` `optional` **urls**: readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1063](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1063)

Base URLs (version may add more)

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`urls`](IConfectionBase.md#urls)

***

### versions

> `readonly` **versions**: readonly [`IMoldedBonBonVersion`](IMoldedBonBonVersion.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1078](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1078)

All versions - resolved.

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`versions`](IConfectionBase.md#versions)

***

### yield

> `readonly` **yield**: [`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1119](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1119)

Yield specification from the golden version

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`yield`](IConfectionBase.md#yield)

## Methods

### getEffectiveTags()

> **getEffectiveTags**(`version?`): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1103](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1103)

Gets effective tags for a specific version.

#### Parameters

##### version?

[`AnyConfectionVersionEntity`](../../Entities/type-aliases/AnyConfectionVersionEntity.md)

The version to get tags for (defaults to golden version)

#### Returns

readonly `string`[]

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`getEffectiveTags`](IConfectionBase.md#geteffectivetags)

***

### getEffectiveUrls()

> **getEffectiveUrls**(`version?`): readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1109](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1109)

Gets effective URLs for a specific version.

#### Parameters

##### version?

[`AnyConfectionVersionEntity`](../../Entities/type-aliases/AnyConfectionVersionEntity.md)

The version to get URLs for (defaults to golden version)

#### Returns

readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`getEffectiveUrls`](IConfectionBase.md#geteffectiveurls)

***

### getVersion()

> **getVersion**(`versionSpec`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldedBonBonVersion`](IMoldedBonBonVersion.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1085](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1085)

Gets a specific version by version specifier.

#### Parameters

##### versionSpec

[`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

The version specifier to find

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldedBonBonVersion`](IMoldedBonBonVersion.md)\>

Success with runtime version, or Failure if not found

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`getVersion`](IConfectionBase.md#getversion)

***

### isBarTruffle()

> **isBarTruffle**(): `this is IBarTruffle`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1139](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1139)

Returns true if this is a bar truffle confection.
When true, bar truffle-specific properties are available.

#### Returns

`this is IBarTruffle`

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`isBarTruffle`](IConfectionBase.md#isbartruffle)

***

### isMoldedBonBon()

> **isMoldedBonBon**(): `this is IMoldedBonBon`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1133](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1133)

Returns true if this is a molded bonbon confection.
When true, molded bonbon-specific properties are available.

#### Returns

`this is IMoldedBonBon`

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`isMoldedBonBon`](IConfectionBase.md#ismoldedbonbon)

***

### isRolledTruffle()

> **isRolledTruffle**(): `this is IRolledTruffle`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1145](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1145)

Returns true if this is a rolled truffle confection.
When true, rolled truffle-specific properties are available.

#### Returns

`this is IRolledTruffle`

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`isRolledTruffle`](IConfectionBase.md#isrolledtruffle)
