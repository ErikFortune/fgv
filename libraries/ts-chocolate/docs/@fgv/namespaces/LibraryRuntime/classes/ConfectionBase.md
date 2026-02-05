[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / ConfectionBase

# Abstract Class: ConfectionBase\<TVersion, TEntity\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:65](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L65)

Abstract base class for runtime confections.
Provides common properties and version navigation shared by all confection types.

## Extended by

- [`MoldedBonBon`](MoldedBonBon.md)
- [`BarTruffle`](BarTruffle.md)
- [`RolledTruffle`](RolledTruffle.md)

## Type Parameters

### TVersion

`TVersion` *extends* [`AnyConfectionVersion`](../type-aliases/AnyConfectionVersion.md) = [`AnyConfectionVersion`](../type-aliases/AnyConfectionVersion.md)

The specific version type for this confection

### TEntity

`TEntity` *extends* [`AnyConfectionEntity`](../../Entities/type-aliases/AnyConfectionEntity.md) = [`AnyConfectionEntity`](../../Entities/type-aliases/AnyConfectionEntity.md)

The specific entity type for this confection

## Implements

- [`IConfectionBase`](../interfaces/IConfectionBase.md)\<`TVersion`\>

## Properties

### \_baseId

> `protected` `readonly` **\_baseId**: [`BaseConfectionId`](../../../../type-aliases/BaseConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:73](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L73)

***

### \_confection

> `protected` `readonly` **\_confection**: `TEntity`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:71](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L71)

***

### \_context

> `protected` `readonly` **\_context**: [`IConfectionContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:69](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L69)

***

### \_goldenVersionEntity

> `protected` `readonly` **\_goldenVersionEntity**: [`AnyConfectionVersionEntity`](../../Entities/type-aliases/AnyConfectionVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:74](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L74)

***

### \_id

> `protected` `readonly` **\_id**: [`ConfectionId`](../../../../type-aliases/ConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:70](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L70)

***

### \_sourceId

> `protected` `readonly` **\_sourceId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:72](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L72)

## Accessors

### baseId

#### Get Signature

> **get** **baseId**(): [`BaseConfectionId`](../../../../type-aliases/BaseConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:127](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L127)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:120](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L120)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:138](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L138)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:182](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L182)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:150](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L150)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:315](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L315)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:322](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L322)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:379](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L379)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:196](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L196)

Resolved filling slots from the golden version (lazy-loaded)

##### Returns

readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[] \| `undefined`

Resolved filling slots from the golden version

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`fillings`](../interfaces/IConfectionBase.md#fillings)

***

### goldenVersion

#### Get Signature

> **get** **goldenVersion**(): `TVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:230](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L230)

The golden (default) version - resolved.
Resolved lazily on first access.

##### Throws

if version creation fails - prefer getGoldenVersion() for proper error handling

##### Returns

`TVersion`

The golden (default) version - resolved.

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`goldenVersion`](../interfaces/IConfectionBase.md#goldenversion)

***

### goldenVersionSpec

#### Get Signature

> **get** **goldenVersionSpec**(): [`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:171](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L171)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:113](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L113)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:143](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L143)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:201](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L201)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:157](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L157)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:164](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L164)

Base URLs (version may add more via additionalUrls)

##### Returns

readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[] \| `undefined`

Base URLs (version may add more)

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`urls`](../interfaces/IConfectionBase.md#urls)

***

### versions

#### Get Signature

> **get** **versions**(): readonly `TVersion`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:257](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L257)

All versions - resolved.
Resolved lazily on first access.

##### Throws

if version creation fails - prefer getVersions() for proper error handling

##### Returns

readonly `TVersion`[]

All versions - resolved.

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`versions`](../interfaces/IConfectionBase.md#versions)

***

### yield

#### Get Signature

> **get** **yield**(): [`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:189](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L189)

Yield specification from the golden version

##### Returns

[`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)

Yield specification from the golden version

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`yield`](../interfaces/IConfectionBase.md#yield)

## Methods

### getEffectiveTags()

> **getEffectiveTags**(`version?`): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:330](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L330)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:342](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L342)

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

### getGoldenVersion()

> **getGoldenVersion**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TVersion`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:215](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L215)

Gets the golden (default) version - resolved.
Resolved lazily on first access.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TVersion`\>

Result with golden version, or Failure if creation fails

***

### getVersion()

> **getVersion**(`versionSpec`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TVersion`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:266](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L266)

Gets a specific version by version specifier.

#### Parameters

##### versionSpec

[`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

The version specifier to find

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TVersion`\>

Success with runtime version, or Failure if not found or creation fails

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`getVersion`](../interfaces/IConfectionBase.md#getversion)

***

### getVersions()

> **getVersions**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `TVersion`[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:240](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L240)

Gets all versions - resolved.
Resolved lazily on first access.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `TVersion`[]\>

Result with all versions, or Failure if any version creation fails

***

### isBarTruffle()

> **isBarTruffle**(): `this is BarTruffle`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:365](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L365)

Returns true if this is a bar truffle confection.

#### Returns

`this is BarTruffle`

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`isBarTruffle`](../interfaces/IConfectionBase.md#isbartruffle)

***

### isMoldedBonBon()

> **isMoldedBonBon**(): `this is MoldedBonBon`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:358](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L358)

Returns true if this is a molded bonbon confection.

#### Returns

`this is MoldedBonBon`

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`isMoldedBonBon`](../interfaces/IConfectionBase.md#ismoldedbonbon)

***

### isRolledTruffle()

> **isRolledTruffle**(): `this is RolledTruffle`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:372](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L372)

Returns true if this is a rolled truffle confection.

#### Returns

`this is RolledTruffle`

#### Implementation of

[`IConfectionBase`](../interfaces/IConfectionBase.md).[`isRolledTruffle`](../interfaces/IConfectionBase.md#isrolledtruffle)
