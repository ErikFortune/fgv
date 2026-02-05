[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / ConfectionBase

# Abstract Class: ConfectionBase

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:62](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L62)

Abstract base class for runtime confections.
Provides common properties and version navigation shared by all confection types.

## Extended by

- [`MoldedBonBon`](MoldedBonBon.md)
- [`BarTruffle`](BarTruffle.md)
- [`RolledTruffle`](RolledTruffle.md)

## Implements

- [`IConfectionBase`](../interfaces/IConfectionBase.md)

## Properties

### \_baseId

> `protected` `readonly` **\_baseId**: [`BaseConfectionId`](../../../../type-aliases/BaseConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:67](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L67)

***

### \_confection

> `protected` `readonly` **\_confection**: [`AnyConfectionEntity`](../../Entities/type-aliases/AnyConfectionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:65](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L65)

***

### \_context

> `protected` `readonly` **\_context**: [`IConfectionContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:63](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L63)

***

### \_goldenVersionEntity

> `protected` `readonly` **\_goldenVersionEntity**: [`AnyConfectionVersionEntity`](../../Entities/type-aliases/AnyConfectionVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:68](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L68)

***

### \_id

> `protected` `readonly` **\_id**: [`ConfectionId`](../../../../type-aliases/ConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:64](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L64)

***

### \_sourceId

> `protected` `readonly` **\_sourceId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:66](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L66)

## Accessors

### baseId

#### Get Signature

> **get** **baseId**(): [`BaseConfectionId`](../../../../type-aliases/BaseConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:125](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L125)

The base confection ID within the source

##### Returns

[`BaseConfectionId`](../../../../type-aliases/BaseConfectionId.md)

The base confection ID within the source.

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`baseId`](../interfaces/IConfectionBase.md#baseid)

***

### collectionId

#### Get Signature

> **get** **collectionId**(): [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:118](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L118)

The source ID part of the composite ID

##### Returns

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID part of the composite ID.

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`collectionId`](../interfaces/IConfectionBase.md#collectionid)

***

### confectionType

#### Get Signature

> **get** `abstract` **confectionType**(): [`ConfectionType`](../../../../type-aliases/ConfectionType.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:136](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L136)

Confection type - must be overridden by subclasses

##### Returns

[`ConfectionType`](../../../../type-aliases/ConfectionType.md)

Confection type (discriminator)

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`confectionType`](../interfaces/IConfectionBase.md#confectiontype)

***

### decorations

#### Get Signature

> **get** **decorations**(): readonly [`IConfectionDecoration`](../../Entities/namespaces/Confections/interfaces/IConfectionDecoration.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:180](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L180)

Decorations from the golden version

##### Returns

readonly [`IConfectionDecoration`](../../Entities/namespaces/Confections/interfaces/IConfectionDecoration.md)[] \| `undefined`

Decorations from the golden version

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`decorations`](../interfaces/IConfectionBase.md#decorations)

***

### description

#### Get Signature

> **get** **description**(): `string` \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:148](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L148)

Optional description

##### Returns

`string` \| `undefined`

Optional description

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`description`](../interfaces/IConfectionBase.md#description)

***

### effectiveTags

#### Get Signature

> **get** **effectiveTags**(): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:284](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L284)

Gets effective tags for the golden version (base tags + version's additional tags).

##### Returns

readonly `string`[]

Gets effective tags for the golden version (base + version's additional tags).

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`effectiveTags`](../interfaces/IConfectionBase.md#effectivetags)

***

### effectiveUrls

#### Get Signature

> **get** **effectiveUrls**(): readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:291](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L291)

Gets effective URLs for the golden version (base URLs + version's additional URLs).

##### Returns

readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Gets effective URLs for the golden version (base + version's additional URLs).

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`effectiveUrls`](../interfaces/IConfectionBase.md#effectiveurls)

***

### entity

#### Get Signature

> **get** `abstract` **entity**(): [`AnyConfectionEntity`](../../Entities/type-aliases/AnyConfectionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:348](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L348)

Gets the underlying confection data entity (read-only)

##### Returns

[`AnyConfectionEntity`](../../Entities/type-aliases/AnyConfectionEntity.md)

Gets the underlying confection entity data.

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`entity`](../interfaces/IConfectionBase.md#entity)

***

### fillings

#### Get Signature

> **get** `abstract` **fillings**(): readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:194](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L194)

Resolved filling slots from the golden version (lazy-loaded)

##### Returns

readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[] \| `undefined`

Resolved filling slots from the golden version

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`fillings`](../interfaces/IConfectionBase.md#fillings)

***

### goldenVersion

#### Get Signature

> **get** **goldenVersion**(): [`AnyConfectionVersion`](../type-aliases/AnyConfectionVersion.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:212](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L212)

The golden (default) version - resolved.
Resolved lazily on first access.

##### Returns

[`AnyConfectionVersion`](../type-aliases/AnyConfectionVersion.md)

The golden (default) version - resolved.

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`goldenVersion`](../interfaces/IConfectionBase.md#goldenversion)

***

### goldenVersionSpec

#### Get Signature

> **get** **goldenVersionSpec**(): [`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:169](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L169)

The ID of the golden (approved default) version

##### Returns

[`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

The ID of the golden (approved default) version

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`goldenVersionSpec`](../interfaces/IConfectionBase.md#goldenversionspec)

***

### id

#### Get Signature

> **get** **id**(): [`ConfectionId`](../../../../type-aliases/ConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:111](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L111)

The composite confection ID (e.g., "common.dark-dome-bonbon")

##### Returns

[`ConfectionId`](../../../../type-aliases/ConfectionId.md)

The composite confection ID (e.g., "common.dark-dome-bonbon").
Combines source and base ID for unique identification across sources.

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`id`](../interfaces/IConfectionBase.md#id)

***

### name

#### Get Signature

> **get** **name**(): [`ConfectionName`](../../../../type-aliases/ConfectionName.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:141](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L141)

Human-readable name

##### Returns

[`ConfectionName`](../../../../type-aliases/ConfectionName.md)

Human-readable name

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`name`](../interfaces/IConfectionBase.md#name)

***

### procedures

#### Get Signature

> **get** `abstract` **procedures**(): [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\> \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:199](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L199)

Resolved procedures from the golden version (lazy-loaded)

##### Returns

[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\> \| `undefined`

Resolved procedures from the golden version

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`procedures`](../interfaces/IConfectionBase.md#procedures)

***

### tags

#### Get Signature

> **get** **tags**(): readonly `string`[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:155](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L155)

Base tags for searching/filtering (version may add more via additionalTags)

##### Returns

readonly `string`[] \| `undefined`

Base tags for searching/filtering (version may add more)

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`tags`](../interfaces/IConfectionBase.md#tags)

***

### urls

#### Get Signature

> **get** **urls**(): readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:162](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L162)

Base URLs (version may add more via additionalUrls)

##### Returns

readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[] \| `undefined`

Base URLs (version may add more)

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`urls`](../interfaces/IConfectionBase.md#urls)

***

### versions

#### Get Signature

> **get** **versions**(): readonly [`AnyConfectionVersion`](../type-aliases/AnyConfectionVersion.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:224](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L224)

All versions - resolved.
Resolved lazily on first access.

##### Returns

readonly [`AnyConfectionVersion`](../type-aliases/AnyConfectionVersion.md)[]

All versions - resolved.

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`versions`](../interfaces/IConfectionBase.md#versions)

***

### yield

#### Get Signature

> **get** **yield**(): [`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:187](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L187)

Yield specification from the golden version

##### Returns

[`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)

Yield specification from the golden version

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`yield`](../interfaces/IConfectionBase.md#yield)

## Methods

### getEffectiveTags()

> **getEffectiveTags**(`version?`): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:299](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L299)

Gets effective tags for a specific version (base tags + version's additional tags).

#### Parameters

##### version?

[`AnyConfectionVersionEntity`](../../Entities/type-aliases/AnyConfectionVersionEntity.md)

The version to get tags for (defaults to golden version)

#### Returns

readonly `string`[]

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`getEffectiveTags`](../interfaces/IConfectionBase.md#geteffectivetags)

***

### getEffectiveUrls()

> **getEffectiveUrls**(`version?`): readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:311](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L311)

Gets effective URLs for a specific version (base URLs + version's additional URLs).

#### Parameters

##### version?

[`AnyConfectionVersionEntity`](../../Entities/type-aliases/AnyConfectionVersionEntity.md)

The version to get URLs for (defaults to golden version)

#### Returns

readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`getEffectiveUrls`](../interfaces/IConfectionBase.md#geteffectiveurls)

***

### getVersion()

> **getVersion**(`versionSpec`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AnyConfectionVersion`](../type-aliases/AnyConfectionVersion.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:236](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L236)

Gets a specific version by version specifier.

#### Parameters

##### versionSpec

[`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

The version specifier to find

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AnyConfectionVersion`](../type-aliases/AnyConfectionVersion.md)\>

Success with runtime version, or Failure if not found

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`getVersion`](../interfaces/IConfectionBase.md#getversion)

***

### isBarTruffle()

> **isBarTruffle**(): `this is BarTruffle`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:334](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L334)

Returns true if this is a bar truffle confection.

#### Returns

`this is BarTruffle`

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`isBarTruffle`](../interfaces/IConfectionBase.md#isbartruffle)

***

### isMoldedBonBon()

> **isMoldedBonBon**(): `this is MoldedBonBon`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:327](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L327)

Returns true if this is a molded bonbon confection.

#### Returns

`this is MoldedBonBon`

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`isMoldedBonBon`](../interfaces/IConfectionBase.md#ismoldedbonbon)

***

### isRolledTruffle()

> **isRolledTruffle**(): `this is RolledTruffle`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:341](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L341)

Returns true if this is a rolled truffle confection.

#### Returns

`this is RolledTruffle`

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`isRolledTruffle`](../interfaces/IConfectionBase.md#isrolledtruffle)
