[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / MoldedBonBon

# Class: MoldedBonBon

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts:52](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts#L52)

A resolved view of a molded bonbon confection with navigation capabilities.
Immutable - does not allow modification of underlying data.

## Extends

- [`ConfectionBase`](ConfectionBase.md)\<[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md), [`IMoldedBonBonEntity`](../../Entities/interfaces/IMoldedBonBonEntity.md)\>

## Implements

- [`IMoldedBonBon`](../interfaces/IMoldedBonBon.md)

## Properties

### \_baseId

> `protected` `readonly` **\_baseId**: [`BaseConfectionId`](../../../../type-aliases/BaseConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:73](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L73)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`_baseId`](ConfectionBase.md#_baseid)

***

### \_confection

> `protected` `readonly` **\_confection**: [`IMoldedBonBonEntity`](../../Entities/interfaces/IMoldedBonBonEntity.md)

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

### additionalChocolates

#### Get Signature

> **get** **additionalChocolates**(): readonly [`IResolvedAdditionalChocolate`](../interfaces/IResolvedAdditionalChocolate.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts:154](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts#L154)

Resolved additional chocolates (from golden version).

##### Returns

readonly [`IResolvedAdditionalChocolate`](../interfaces/IResolvedAdditionalChocolate.md)[] \| `undefined`

Resolved additional chocolates (from golden version)

#### Implementation of

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`additionalChocolates`](../interfaces/IMoldedBonBon.md#additionalchocolates)

***

### baseId

#### Get Signature

> **get** **baseId**(): [`BaseConfectionId`](../../../../type-aliases/BaseConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:127](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L127)

The base confection ID within the source

##### Returns

[`BaseConfectionId`](../../../../type-aliases/BaseConfectionId.md)

The base confection ID within the source.

#### Implementation of

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`baseId`](../interfaces/IMoldedBonBon.md#baseid)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`baseId`](ConfectionBase.md#baseid)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`collectionId`](../interfaces/IMoldedBonBon.md#collectionid)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`collectionId`](ConfectionBase.md#collectionid)

***

### confectionType

#### Get Signature

> **get** **confectionType**(): `"molded-bonbon"`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts:94](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts#L94)

Confection type is always 'molded-bonbon' for this type

##### Returns

`"molded-bonbon"`

Type is always 'molded-bonbon' for this confection

#### Implementation of

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`confectionType`](../interfaces/IMoldedBonBon.md#confectiontype)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`decorations`](../interfaces/IMoldedBonBon.md#decorations)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`description`](../interfaces/IMoldedBonBon.md#description)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`effectiveTags`](../interfaces/IMoldedBonBon.md#effectivetags)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`effectiveUrls`](../interfaces/IMoldedBonBon.md#effectiveurls)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`effectiveUrls`](ConfectionBase.md#effectiveurls)

***

### entity

#### Get Signature

> **get** **entity**(): [`IMoldedBonBonEntity`](../../Entities/interfaces/IMoldedBonBonEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts:161](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts#L161)

Gets the underlying molded bonbon data entity

##### Returns

[`IMoldedBonBonEntity`](../../Entities/interfaces/IMoldedBonBonEntity.md)

Gets the underlying confection entity data.

#### Implementation of

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`entity`](../interfaces/IMoldedBonBon.md#entity)

#### Overrides

[`ConfectionBase`](ConfectionBase.md).[`entity`](ConfectionBase.md#entity)

***

### fillings

#### Get Signature

> **get** **fillings**(): readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts:124](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts#L124)

Resolved filling slots from the golden version.

##### Returns

readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[] \| `undefined`

Resolved filling slots from the golden version

#### Implementation of

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`fillings`](../interfaces/IMoldedBonBon.md#fillings)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`goldenVersion`](../interfaces/IMoldedBonBon.md#goldenversion)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`goldenVersionSpec`](../interfaces/IMoldedBonBon.md#goldenversionspec)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`id`](../interfaces/IMoldedBonBon.md#id)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`id`](ConfectionBase.md#id)

***

### molds

#### Get Signature

> **get** **molds**(): [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionMoldRef`](../interfaces/IResolvedConfectionMoldRef.md), [`MoldId`](../../../../type-aliases/MoldId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts:140](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts#L140)

Resolved molds with preferred selection (from golden version).

##### Returns

[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionMoldRef`](../interfaces/IResolvedConfectionMoldRef.md), [`MoldId`](../../../../type-aliases/MoldId.md)\>

Resolved molds with preferred selection (from golden version)

#### Implementation of

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`molds`](../interfaces/IMoldedBonBon.md#molds)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`name`](../interfaces/IMoldedBonBon.md#name)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`name`](ConfectionBase.md#name)

***

### procedures

#### Get Signature

> **get** **procedures**(): [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\> \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts:131](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts#L131)

Resolved procedures from the golden version.

##### Returns

[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\> \| `undefined`

Resolved procedures from the golden version

#### Implementation of

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`procedures`](../interfaces/IMoldedBonBon.md#procedures)

#### Overrides

[`ConfectionBase`](ConfectionBase.md).[`procedures`](ConfectionBase.md#procedures)

***

### shellChocolate

#### Get Signature

> **get** **shellChocolate**(): [`IResolvedChocolateSpec`](../interfaces/IResolvedChocolateSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts:147](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts#L147)

Resolved shell chocolate specification (from golden version).

##### Returns

[`IResolvedChocolateSpec`](../interfaces/IResolvedChocolateSpec.md)

Resolved shell chocolate specification (from golden version)

#### Implementation of

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`shellChocolate`](../interfaces/IMoldedBonBon.md#shellchocolate)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`tags`](../interfaces/IMoldedBonBon.md#tags)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`urls`](../interfaces/IMoldedBonBon.md#urls)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`versions`](../interfaces/IMoldedBonBon.md#versions)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`yield`](../interfaces/IMoldedBonBon.md#yield)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`getEffectiveTags`](../interfaces/IMoldedBonBon.md#geteffectivetags)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`getEffectiveUrls`](../interfaces/IMoldedBonBon.md#geteffectiveurls)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`getEffectiveUrls`](ConfectionBase.md#geteffectiveurls)

***

### getGoldenVersion()

> **getGoldenVersion**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:215](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L215)

Gets the golden (default) version - resolved.
Resolved lazily on first access.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md)\>

Result with golden version, or Failure if creation fails

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`getGoldenVersion`](ConfectionBase.md#getgoldenversion)

***

### getVersion()

> **getVersion**(`versionSpec`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:266](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L266)

Gets a specific version by version specifier.

#### Parameters

##### versionSpec

[`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

The version specifier to find

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md)\>

Success with runtime version, or Failure if not found or creation fails

#### Implementation of

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`getVersion`](../interfaces/IMoldedBonBon.md#getversion)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`getVersion`](ConfectionBase.md#getversion)

***

### getVersions()

> **getVersions**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:240](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L240)

Gets all versions - resolved.
Resolved lazily on first access.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md)[]\>

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`isBarTruffle`](../interfaces/IMoldedBonBon.md#isbartruffle)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`isMoldedBonBon`](../interfaces/IMoldedBonBon.md#ismoldedbonbon)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`isRolledTruffle`](../interfaces/IMoldedBonBon.md#isrolledtruffle)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`isRolledTruffle`](ConfectionBase.md#isrolledtruffle)

***

### create()

> `static` **create**(`context`, `id`, `confection`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`MoldedBonBon`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts:79](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts#L79)

Factory method for creating a MoldedBonBon.

#### Parameters

##### context

[`IConfectionContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

The runtime context

##### id

[`ConfectionId`](../../../../type-aliases/ConfectionId.md)

The confection ID

##### confection

[`IMoldedBonBonEntity`](../../Entities/interfaces/IMoldedBonBonEntity.md)

The molded bonbon data

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`MoldedBonBon`\>

Success with MoldedBonBon
