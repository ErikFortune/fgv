[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / RolledTruffle

# Class: RolledTruffle

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts:51](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts#L51)

A resolved view of a rolled truffle confection with navigation capabilities.
Immutable - does not allow modification of underlying data.

## Extends

- [`ConfectionBase`](ConfectionBase.md)\<[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md), [`IRolledTruffleEntity`](../../Entities/interfaces/IRolledTruffleEntity.md)\>

## Implements

- [`IRolledTruffle`](../interfaces/IRolledTruffle.md)

## Properties

### \_baseId

> `protected` `readonly` **\_baseId**: [`BaseConfectionId`](../../../../type-aliases/BaseConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:73](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L73)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`_baseId`](ConfectionBase.md#_baseid)

***

### \_confection

> `protected` `readonly` **\_confection**: [`IRolledTruffleEntity`](../../Entities/interfaces/IRolledTruffleEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:71](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L71)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`_confection`](ConfectionBase.md#_confection)

***

### \_context

> `protected` `readonly` **\_context**: [`IConfectionContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:69](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L69)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`_context`](ConfectionBase.md#_context)

***

### \_goldenVersionEntity

> `protected` `readonly` **\_goldenVersionEntity**: [`AnyConfectionVersionEntity`](../../Entities/type-aliases/AnyConfectionVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:74](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L74)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`_goldenVersionEntity`](ConfectionBase.md#_goldenversionentity)

***

### \_id

> `protected` `readonly` **\_id**: [`ConfectionId`](../../../../type-aliases/ConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:70](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L70)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`_id`](ConfectionBase.md#_id)

***

### \_sourceId

> `protected` `readonly` **\_sourceId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:72](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L72)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`_sourceId`](ConfectionBase.md#_sourceid)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`baseId`](../interfaces/IRolledTruffle.md#baseid)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`baseId`](ConfectionBase.md#baseid)

***

### coatings

#### Get Signature

> **get** **coatings**(): [`IResolvedCoatings`](../interfaces/IResolvedCoatings.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts:146](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts#L146)

Resolved coating specification (from golden version, optional).

##### Returns

[`IResolvedCoatings`](../interfaces/IResolvedCoatings.md) \| `undefined`

Resolved coatings (from golden version, optional)

#### Implementation of

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`coatings`](../interfaces/IRolledTruffle.md#coatings)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`collectionId`](../interfaces/IRolledTruffle.md#collectionid)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`collectionId`](ConfectionBase.md#collectionid)

***

### confectionType

#### Get Signature

> **get** **confectionType**(): `"rolled-truffle"`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts:93](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts#L93)

Confection type is always 'rolled-truffle' for this type

##### Returns

`"rolled-truffle"`

Type is always 'rolled-truffle' for this confection

#### Implementation of

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`confectionType`](../interfaces/IRolledTruffle.md#confectiontype)

#### Overrides

[`ConfectionBase`](ConfectionBase.md).[`confectionType`](ConfectionBase.md#confectiontype)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`decorations`](../interfaces/IRolledTruffle.md#decorations)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`decorations`](ConfectionBase.md#decorations)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`description`](../interfaces/IRolledTruffle.md#description)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`description`](ConfectionBase.md#description)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`effectiveTags`](../interfaces/IRolledTruffle.md#effectivetags)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`effectiveTags`](ConfectionBase.md#effectivetags)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`effectiveUrls`](../interfaces/IRolledTruffle.md#effectiveurls)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`effectiveUrls`](ConfectionBase.md#effectiveurls)

***

### enrobingChocolate

#### Get Signature

> **get** **enrobingChocolate**(): [`IResolvedChocolateSpec`](../interfaces/IResolvedChocolateSpec.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts:139](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts#L139)

Resolved enrobing chocolate specification (from golden version, optional).

##### Returns

[`IResolvedChocolateSpec`](../interfaces/IResolvedChocolateSpec.md) \| `undefined`

Resolved enrobing chocolate (from golden version, optional)

#### Implementation of

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`enrobingChocolate`](../interfaces/IRolledTruffle.md#enrobingchocolate)

***

### entity

#### Get Signature

> **get** **entity**(): [`IRolledTruffleEntity`](../../Entities/interfaces/IRolledTruffleEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts:153](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts#L153)

Gets the underlying rolled truffle data entity

##### Returns

[`IRolledTruffleEntity`](../../Entities/interfaces/IRolledTruffleEntity.md)

Gets the underlying confection entity data.

#### Implementation of

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`entity`](../interfaces/IRolledTruffle.md#entity)

#### Overrides

[`ConfectionBase`](ConfectionBase.md).[`entity`](ConfectionBase.md#entity)

***

### fillings

#### Get Signature

> **get** **fillings**(): readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts:123](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts#L123)

Resolved filling slots from the golden version.

##### Returns

readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[] \| `undefined`

Resolved filling slots from the golden version

#### Implementation of

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`fillings`](../interfaces/IRolledTruffle.md#fillings)

#### Overrides

[`ConfectionBase`](ConfectionBase.md).[`fillings`](ConfectionBase.md#fillings)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`goldenVersion`](../interfaces/IRolledTruffle.md#goldenversion)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`goldenVersion`](ConfectionBase.md#goldenversion)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`goldenVersionSpec`](../interfaces/IRolledTruffle.md#goldenversionspec)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`goldenVersionSpec`](ConfectionBase.md#goldenversionspec)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`id`](../interfaces/IRolledTruffle.md#id)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`id`](ConfectionBase.md#id)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`name`](../interfaces/IRolledTruffle.md#name)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`name`](ConfectionBase.md#name)

***

### procedures

#### Get Signature

> **get** **procedures**(): [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\> \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts:130](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts#L130)

Resolved procedures from the golden version.

##### Returns

[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\> \| `undefined`

Resolved procedures from the golden version

#### Implementation of

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`procedures`](../interfaces/IRolledTruffle.md#procedures)

#### Overrides

[`ConfectionBase`](ConfectionBase.md).[`procedures`](ConfectionBase.md#procedures)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`tags`](../interfaces/IRolledTruffle.md#tags)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`tags`](ConfectionBase.md#tags)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`urls`](../interfaces/IRolledTruffle.md#urls)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`urls`](ConfectionBase.md#urls)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`versions`](../interfaces/IRolledTruffle.md#versions)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`versions`](ConfectionBase.md#versions)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`yield`](../interfaces/IRolledTruffle.md#yield)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`yield`](ConfectionBase.md#yield)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`getEffectiveTags`](../interfaces/IRolledTruffle.md#geteffectivetags)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`getEffectiveTags`](ConfectionBase.md#geteffectivetags)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`getEffectiveUrls`](../interfaces/IRolledTruffle.md#geteffectiveurls)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`getEffectiveUrls`](ConfectionBase.md#geteffectiveurls)

***

### getGoldenVersion()

> **getGoldenVersion**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:215](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L215)

Gets the golden (default) version - resolved.
Resolved lazily on first access.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md)\>

Result with golden version, or Failure if creation fails

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`getGoldenVersion`](ConfectionBase.md#getgoldenversion)

***

### getVersion()

> **getVersion**(`versionSpec`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:266](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L266)

Gets a specific version by version specifier.

#### Parameters

##### versionSpec

[`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

The version specifier to find

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md)\>

Success with runtime version, or Failure if not found or creation fails

#### Implementation of

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`getVersion`](../interfaces/IRolledTruffle.md#getversion)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`getVersion`](ConfectionBase.md#getversion)

***

### getVersions()

> **getVersions**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:240](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L240)

Gets all versions - resolved.
Resolved lazily on first access.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md)[]\>

Result with all versions, or Failure if any version creation fails

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`getVersions`](ConfectionBase.md#getversions)

***

### isBarTruffle()

> **isBarTruffle**(): `this is BarTruffle`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:365](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L365)

Returns true if this is a bar truffle confection.

#### Returns

`this is BarTruffle`

#### Implementation of

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`isBarTruffle`](../interfaces/IRolledTruffle.md#isbartruffle)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`isBarTruffle`](ConfectionBase.md#isbartruffle)

***

### isMoldedBonBon()

> **isMoldedBonBon**(): `this is MoldedBonBon`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:358](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L358)

Returns true if this is a molded bonbon confection.

#### Returns

`this is MoldedBonBon`

#### Implementation of

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`isMoldedBonBon`](../interfaces/IRolledTruffle.md#ismoldedbonbon)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`isMoldedBonBon`](ConfectionBase.md#ismoldedbonbon)

***

### isRolledTruffle()

> **isRolledTruffle**(): `this is RolledTruffle`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:372](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L372)

Returns true if this is a rolled truffle confection.

#### Returns

`this is RolledTruffle`

#### Implementation of

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`isRolledTruffle`](../interfaces/IRolledTruffle.md#isrolledtruffle)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`isRolledTruffle`](ConfectionBase.md#isrolledtruffle)

***

### create()

> `static` **create**(`context`, `id`, `confection`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`RolledTruffle`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts:78](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts#L78)

Factory method for creating a RolledTruffle.

#### Parameters

##### context

[`IConfectionContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

The runtime context

##### id

[`ConfectionId`](../../../../type-aliases/ConfectionId.md)

The confection ID

##### confection

[`IRolledTruffleEntity`](../../Entities/interfaces/IRolledTruffleEntity.md)

The rolled truffle data

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`RolledTruffle`\>

Success with RolledTruffle
