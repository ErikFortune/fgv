[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IMoldedBonBon

# Interface: IMoldedBonBon

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1156](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1156)

Runtime confection narrowed to molded bonbon type.

## Extends

- [`IConfectionBase`](IConfectionBase.md)

## Properties

### additionalChocolates?

> `readonly` `optional` **additionalChocolates**: readonly [`IResolvedAdditionalChocolate`](IResolvedAdditionalChocolate.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1176](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1176)

Resolved additional chocolates (from golden version)

***

### baseId

> `readonly` **baseId**: [`BaseConfectionId`](../../../../type-aliases/BaseConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1045](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1045)

The base confection ID within the source.

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`baseId`](IConfectionBase.md#baseid)

***

### collectionId

> `readonly` **collectionId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1040](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1040)

The collection ID part of the composite ID.

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`collectionId`](IConfectionBase.md#collectionid)

***

### confectionType

> `readonly` **confectionType**: `"molded-bonbon"`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1158](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1158)

Type is always 'molded-bonbon' for this confection

#### Overrides

[`IConfectionBase`](IConfectionBase.md).[`confectionType`](IConfectionBase.md#confectiontype)

***

### decorations?

> `readonly` `optional` **decorations**: readonly [`IConfectionDecoration`](../../Entities/namespaces/Confections/interfaces/IConfectionDecoration.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1115](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1115)

Decorations from the golden version

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`decorations`](IConfectionBase.md#decorations)

***

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1056](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1056)

Optional description

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`description`](IConfectionBase.md#description)

***

### effectiveTags

> `readonly` **effectiveTags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1091](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1091)

Gets effective tags for the golden version (base + version's additional tags).

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`effectiveTags`](IConfectionBase.md#effectivetags)

***

### effectiveUrls

> `readonly` **effectiveUrls**: readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1096](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1096)

Gets effective URLs for the golden version (base + version's additional URLs).

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`effectiveUrls`](IConfectionBase.md#effectiveurls)

***

### entity

> `readonly` **entity**: [`IMoldedBonBonEntity`](../../Entities/interfaces/IMoldedBonBonEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1179](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1179)

Entity data typed to IMoldedBonBon

#### Overrides

[`IConfectionBase`](IConfectionBase.md).[`entity`](IConfectionBase.md#entity)

***

### fillings?

> `readonly` `optional` **fillings**: readonly [`IResolvedFillingSlot`](IResolvedFillingSlot.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1121](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1121)

Resolved filling slots from the golden version

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`fillings`](IConfectionBase.md#fillings)

***

### goldenVersion

> `readonly` **goldenVersion**: [`IMoldedBonBonVersion`](IMoldedBonBonVersion.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1161](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1161)

Golden version typed as IRuntimeMoldedBonBonVersion

#### Overrides

[`IConfectionBase`](IConfectionBase.md).[`goldenVersion`](IConfectionBase.md#goldenversion)

***

### goldenVersionSpec

> `readonly` **goldenVersionSpec**: [`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1065](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1065)

The ID of the golden (approved default) version

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`goldenVersionSpec`](IConfectionBase.md#goldenversionspec)

***

### id

> `readonly` **id**: [`ConfectionId`](../../../../type-aliases/ConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1035](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1035)

The composite confection ID (e.g., "common.dark-dome-bonbon").
Combines source and base ID for unique identification across sources.

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`id`](IConfectionBase.md#id)

***

### molds

> `readonly` **molds**: [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionMoldRef`](IResolvedConfectionMoldRef.md), [`MoldId`](../../../../type-aliases/MoldId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1170](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1170)

Resolved molds with preferred selection (from golden version)

***

### name

> `readonly` **name**: [`ConfectionName`](../../../../type-aliases/ConfectionName.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1053](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1053)

Human-readable name

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`name`](IConfectionBase.md#name)

***

### procedures?

> `readonly` `optional` **procedures**: [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1124](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1124)

Resolved procedures from the golden version

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`procedures`](IConfectionBase.md#procedures)

***

### shellChocolate

> `readonly` **shellChocolate**: [`IResolvedChocolateSpec`](IResolvedChocolateSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1173](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1173)

Resolved shell chocolate specification (from golden version)

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1059](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1059)

Base tags for searching/filtering (version may add more)

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`tags`](IConfectionBase.md#tags)

***

### urls?

> `readonly` `optional` **urls**: readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1062](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1062)

Base URLs (version may add more)

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`urls`](IConfectionBase.md#urls)

***

### versions

> `readonly` **versions**: readonly [`IMoldedBonBonVersion`](IMoldedBonBonVersion.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1164](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1164)

All versions typed as IRuntimeMoldedBonBonVersion

#### Overrides

[`IConfectionBase`](IConfectionBase.md).[`versions`](IConfectionBase.md#versions)

***

### yield

> `readonly` **yield**: [`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1118](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1118)

Yield specification from the golden version

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`yield`](IConfectionBase.md#yield)

## Methods

### getEffectiveTags()

> **getEffectiveTags**(`version?`): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1102](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1102)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1108](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1108)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1167](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1167)

Gets a specific version - returns typed version

#### Parameters

##### versionSpec

[`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldedBonBonVersion`](IMoldedBonBonVersion.md)\>

#### Overrides

[`IConfectionBase`](IConfectionBase.md).[`getVersion`](IConfectionBase.md#getversion)

***

### isBarTruffle()

> **isBarTruffle**(): `this is IBarTruffle`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1138](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1138)

Returns true if this is a bar truffle confection.
When true, bar truffle-specific properties are available.

#### Returns

`this is IBarTruffle`

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`isBarTruffle`](IConfectionBase.md#isbartruffle)

***

### isMoldedBonBon()

> **isMoldedBonBon**(): `this is IMoldedBonBon`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1132](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1132)

Returns true if this is a molded bonbon confection.
When true, molded bonbon-specific properties are available.

#### Returns

`this is IMoldedBonBon`

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`isMoldedBonBon`](IConfectionBase.md#ismoldedbonbon)

***

### isRolledTruffle()

> **isRolledTruffle**(): `this is IRolledTruffle`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1144](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1144)

Returns true if this is a rolled truffle confection.
When true, rolled truffle-specific properties are available.

#### Returns

`this is IRolledTruffle`

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`isRolledTruffle`](IConfectionBase.md#isrolledtruffle)
