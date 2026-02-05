[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IBarTruffle

# Interface: IBarTruffle

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1181](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1181)

Runtime confection narrowed to bar truffle type.

## Extends

- [`IConfectionBase`](IConfectionBase.md)\<[`IBarTruffleVersion`](IBarTruffleVersion.md), [`IBarTruffleEntity`](../../Entities/interfaces/IBarTruffleEntity.md)\>

## Properties

### baseId

> `readonly` **baseId**: [`BaseConfectionId`](../../../../type-aliases/BaseConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1051](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1051)

The base confection ID within the source.

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`baseId`](IConfectionBase.md#baseid)

***

### collectionId

> `readonly` **collectionId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1046](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1046)

The collection ID part of the composite ID.

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`collectionId`](IConfectionBase.md#collectionid)

***

### confectionType

> `readonly` **confectionType**: `"bar-truffle"`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1183](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1183)

Type is always 'bar-truffle' for this confection

#### Overrides

[`IConfectionBase`](IConfectionBase.md).[`confectionType`](IConfectionBase.md#confectiontype)

***

### decorations?

> `readonly` `optional` **decorations**: readonly [`IConfectionDecoration`](../../Entities/namespaces/Confections/interfaces/IConfectionDecoration.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1121](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1121)

Decorations from the golden version

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`decorations`](IConfectionBase.md#decorations)

***

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1062](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1062)

Optional description

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`description`](IConfectionBase.md#description)

***

### effectiveTags

> `readonly` **effectiveTags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1097](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1097)

Gets effective tags for the golden version (base + version's additional tags).

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`effectiveTags`](IConfectionBase.md#effectivetags)

***

### effectiveUrls

> `readonly` **effectiveUrls**: readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1102](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1102)

Gets effective URLs for the golden version (base + version's additional URLs).

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`effectiveUrls`](IConfectionBase.md#effectiveurls)

***

### enrobingChocolate?

> `readonly` `optional` **enrobingChocolate**: [`IResolvedChocolateSpec`](IResolvedChocolateSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1192](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1192)

Resolved enrobing chocolate (from golden version, optional)

***

### entity

> `readonly` **entity**: [`IBarTruffleEntity`](../../Entities/interfaces/IBarTruffleEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1155](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1155)

Gets the underlying confection entity data.

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`entity`](IConfectionBase.md#entity)

***

### fillings?

> `readonly` `optional` **fillings**: readonly [`IResolvedFillingSlot`](IResolvedFillingSlot.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1127](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1127)

Resolved filling slots from the golden version

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`fillings`](IConfectionBase.md#fillings)

***

### frameDimensions

> `readonly` **frameDimensions**: [`IFrameDimensions`](../../Entities/namespaces/Confections/interfaces/IFrameDimensions.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1186](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1186)

Frame dimensions from the golden version

***

### goldenVersion

> `readonly` **goldenVersion**: [`IBarTruffleVersion`](IBarTruffleVersion.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1078](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1078)

The golden (default) version - resolved.

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`goldenVersion`](IConfectionBase.md#goldenversion)

***

### goldenVersionSpec

> `readonly` **goldenVersionSpec**: [`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1071](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1071)

The ID of the golden (approved default) version

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`goldenVersionSpec`](IConfectionBase.md#goldenversionspec)

***

### id

> `readonly` **id**: [`ConfectionId`](../../../../type-aliases/ConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1041](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1041)

The composite confection ID (e.g., "common.dark-dome-bonbon").
Combines source and base ID for unique identification across sources.

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`id`](IConfectionBase.md#id)

***

### name

> `readonly` **name**: [`ConfectionName`](../../../../type-aliases/ConfectionName.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1059](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1059)

Human-readable name

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`name`](IConfectionBase.md#name)

***

### procedures?

> `readonly` `optional` **procedures**: [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1130](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1130)

Resolved procedures from the golden version

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`procedures`](IConfectionBase.md#procedures)

***

### singleBonBonDimensions

> `readonly` **singleBonBonDimensions**: [`IBonBonDimensions`](../../Entities/namespaces/Confections/interfaces/IBonBonDimensions.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1189](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1189)

Single bonbon dimensions from the golden version

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1065](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1065)

Base tags for searching/filtering (version may add more)

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`tags`](IConfectionBase.md#tags)

***

### urls?

> `readonly` `optional` **urls**: readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1068](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1068)

Base URLs (version may add more)

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`urls`](IConfectionBase.md#urls)

***

### versions

> `readonly` **versions**: readonly [`IBarTruffleVersion`](IBarTruffleVersion.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1083](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1083)

All versions - resolved.

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`versions`](IConfectionBase.md#versions)

***

### yield

> `readonly` **yield**: [`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1124](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1124)

Yield specification from the golden version

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`yield`](IConfectionBase.md#yield)

## Methods

### getEffectiveTags()

> **getEffectiveTags**(`version?`): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1108](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1108)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1114](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1114)

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

> **getVersion**(`versionSpec`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IBarTruffleVersion`](IBarTruffleVersion.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1090](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1090)

Gets a specific version by version specifier.

#### Parameters

##### versionSpec

[`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

The version specifier to find

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IBarTruffleVersion`](IBarTruffleVersion.md)\>

Success with runtime version, or Failure if not found

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`getVersion`](IConfectionBase.md#getversion)

***

### isBarTruffle()

> **isBarTruffle**(): `this is IBarTruffle`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1144](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1144)

Returns true if this is a bar truffle confection.
When true, bar truffle-specific properties are available.

#### Returns

`this is IBarTruffle`

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`isBarTruffle`](IConfectionBase.md#isbartruffle)

***

### isMoldedBonBon()

> **isMoldedBonBon**(): `this is IMoldedBonBon`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1138](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1138)

Returns true if this is a molded bonbon confection.
When true, molded bonbon-specific properties are available.

#### Returns

`this is IMoldedBonBon`

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`isMoldedBonBon`](IConfectionBase.md#ismoldedbonbon)

***

### isRolledTruffle()

> **isRolledTruffle**(): `this is IRolledTruffle`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1150](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1150)

Returns true if this is a rolled truffle confection.
When true, rolled truffle-specific properties are available.

#### Returns

`this is IRolledTruffle`

#### Inherited from

[`IConfectionBase`](IConfectionBase.md).[`isRolledTruffle`](IConfectionBase.md#isrolledtruffle)
