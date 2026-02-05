[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / BarTruffle

# Class: BarTruffle

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/barTruffle.ts:50](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/barTruffle.ts#L50)

A resolved view of a bar truffle confection with navigation capabilities.
Immutable - does not allow modification of underlying data.

## Extends

- [`ConfectionBase`](ConfectionBase.md)\<[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md), [`IBarTruffleEntity`](../../Entities/interfaces/IBarTruffleEntity.md)\>

## Implements

- [`IBarTruffle`](../interfaces/IBarTruffle.md)

## Properties

### \_baseId

> `protected` `readonly` **\_baseId**: [`BaseConfectionId`](../../../../type-aliases/BaseConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:74](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L74)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`_baseId`](ConfectionBase.md#_baseid)

***

### \_confection

> `protected` `readonly` **\_confection**: [`IBarTruffleEntity`](../../Entities/interfaces/IBarTruffleEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:72](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L72)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`_confection`](ConfectionBase.md#_confection)

***

### \_context

> `protected` `readonly` **\_context**: [`IConfectionContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:70](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L70)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`_context`](ConfectionBase.md#_context)

***

### \_goldenVersionEntity

> `protected` `readonly` **\_goldenVersionEntity**: [`AnyConfectionVersionEntity`](../../Entities/type-aliases/AnyConfectionVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:75](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L75)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`_goldenVersionEntity`](ConfectionBase.md#_goldenversionentity)

***

### \_id

> `protected` `readonly` **\_id**: [`ConfectionId`](../../../../type-aliases/ConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:71](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L71)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`_id`](ConfectionBase.md#_id)

***

### \_sourceId

> `protected` `readonly` **\_sourceId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:73](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L73)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`_sourceId`](ConfectionBase.md#_sourceid)

## Accessors

### baseId

#### Get Signature

> **get** **baseId**(): [`BaseConfectionId`](../../../../type-aliases/BaseConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:128](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L128)

The base confection ID within the source

##### Returns

[`BaseConfectionId`](../../../../type-aliases/BaseConfectionId.md)

The base confection ID within the source.

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`baseId`](../interfaces/IBarTruffle.md#baseid)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`baseId`](ConfectionBase.md#baseid)

***

### collectionId

#### Get Signature

> **get** **collectionId**(): [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:121](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L121)

The source ID part of the composite ID

##### Returns

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID part of the composite ID.

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`collectionId`](../interfaces/IBarTruffle.md#collectionid)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`collectionId`](ConfectionBase.md#collectionid)

***

### confectionType

#### Get Signature

> **get** **confectionType**(): `"bar-truffle"`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/barTruffle.ts:92](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/barTruffle.ts#L92)

Confection type is always 'bar-truffle' for this type

##### Returns

`"bar-truffle"`

Type is always 'bar-truffle' for this confection

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`confectionType`](../interfaces/IBarTruffle.md#confectiontype)

#### Overrides

[`ConfectionBase`](ConfectionBase.md).[`confectionType`](ConfectionBase.md#confectiontype)

***

### decorations

#### Get Signature

> **get** **decorations**(): readonly [`IConfectionDecoration`](../../Entities/namespaces/Confections/interfaces/IConfectionDecoration.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:183](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L183)

Decorations from the golden version

##### Returns

readonly [`IConfectionDecoration`](../../Entities/namespaces/Confections/interfaces/IConfectionDecoration.md)[] \| `undefined`

Decorations from the golden version

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`decorations`](../interfaces/IBarTruffle.md#decorations)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`decorations`](ConfectionBase.md#decorations)

***

### description

#### Get Signature

> **get** **description**(): `string` \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:151](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L151)

Optional description

##### Returns

`string` \| `undefined`

Optional description

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`description`](../interfaces/IBarTruffle.md#description)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`description`](ConfectionBase.md#description)

***

### effectiveTags

#### Get Signature

> **get** **effectiveTags**(): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:316](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L316)

Gets effective tags for the golden version (base tags + version's additional tags).

##### Returns

readonly `string`[]

Gets effective tags for the golden version (base + version's additional tags).

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`effectiveTags`](../interfaces/IBarTruffle.md#effectivetags)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`effectiveTags`](ConfectionBase.md#effectivetags)

***

### effectiveUrls

#### Get Signature

> **get** **effectiveUrls**(): readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:323](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L323)

Gets effective URLs for the golden version (base URLs + version's additional URLs).

##### Returns

readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Gets effective URLs for the golden version (base + version's additional URLs).

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`effectiveUrls`](../interfaces/IBarTruffle.md#effectiveurls)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`effectiveUrls`](ConfectionBase.md#effectiveurls)

***

### enrobingChocolate

#### Get Signature

> **get** **enrobingChocolate**(): [`IResolvedChocolateSpec`](../interfaces/IResolvedChocolateSpec.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/barTruffle.ts:149](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/barTruffle.ts#L149)

Resolved enrobing chocolate specification (from golden version, optional).

##### Returns

[`IResolvedChocolateSpec`](../interfaces/IResolvedChocolateSpec.md) \| `undefined`

Resolved enrobing chocolate (from golden version, optional)

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`enrobingChocolate`](../interfaces/IBarTruffle.md#enrobingchocolate)

***

### entity

#### Get Signature

> **get** **entity**(): [`IBarTruffleEntity`](../../Entities/interfaces/IBarTruffleEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/barTruffle.ts:156](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/barTruffle.ts#L156)

Gets the underlying raw bar truffle data

##### Returns

[`IBarTruffleEntity`](../../Entities/interfaces/IBarTruffleEntity.md)

Gets the underlying confection entity data.

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`entity`](../interfaces/IBarTruffle.md#entity)

#### Overrides

[`ConfectionBase`](ConfectionBase.md).[`entity`](ConfectionBase.md#entity)

***

### fillings

#### Get Signature

> **get** **fillings**(): readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/barTruffle.ts:133](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/barTruffle.ts#L133)

Resolved filling slots from the golden version.

##### Returns

readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[] \| `undefined`

Resolved filling slots from the golden version

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`fillings`](../interfaces/IBarTruffle.md#fillings)

#### Overrides

[`ConfectionBase`](ConfectionBase.md).[`fillings`](ConfectionBase.md#fillings)

***

### frameDimensions

#### Get Signature

> **get** **frameDimensions**(): [`IFrameDimensions`](../../Entities/namespaces/Confections/interfaces/IFrameDimensions.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/barTruffle.ts:119](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/barTruffle.ts#L119)

Frame dimensions for ganache slab (from golden version).

##### Returns

[`IFrameDimensions`](../../Entities/namespaces/Confections/interfaces/IFrameDimensions.md)

Frame dimensions from the golden version

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`frameDimensions`](../interfaces/IBarTruffle.md#framedimensions)

***

### goldenVersion

#### Get Signature

> **get** **goldenVersion**(): `TVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:231](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L231)

The golden (default) version - resolved.
Resolved lazily on first access.

##### Throws

if version creation fails - prefer getGoldenVersion() for proper error handling

##### Returns

`TVersion`

The golden (default) version - resolved.

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`goldenVersion`](../interfaces/IBarTruffle.md#goldenversion)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`goldenVersion`](ConfectionBase.md#goldenversion)

***

### goldenVersionSpec

#### Get Signature

> **get** **goldenVersionSpec**(): [`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:172](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L172)

The ID of the golden (approved default) version

##### Returns

[`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

The ID of the golden (approved default) version

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`goldenVersionSpec`](../interfaces/IBarTruffle.md#goldenversionspec)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`goldenVersionSpec`](ConfectionBase.md#goldenversionspec)

***

### id

#### Get Signature

> **get** **id**(): [`ConfectionId`](../../../../type-aliases/ConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:114](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L114)

The composite confection ID (e.g., "common.dark-dome-bonbon")

##### Returns

[`ConfectionId`](../../../../type-aliases/ConfectionId.md)

The composite confection ID (e.g., "common.dark-dome-bonbon").
Combines source and base ID for unique identification across sources.

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`id`](../interfaces/IBarTruffle.md#id)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`id`](ConfectionBase.md#id)

***

### name

#### Get Signature

> **get** **name**(): [`ConfectionName`](../../../../type-aliases/ConfectionName.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:144](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L144)

Human-readable name

##### Returns

[`ConfectionName`](../../../../type-aliases/ConfectionName.md)

Human-readable name

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`name`](../interfaces/IBarTruffle.md#name)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`name`](ConfectionBase.md#name)

***

### procedures

#### Get Signature

> **get** **procedures**(): [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\> \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/barTruffle.ts:140](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/barTruffle.ts#L140)

Resolved procedures from the golden version.

##### Returns

[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\> \| `undefined`

Resolved procedures from the golden version

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`procedures`](../interfaces/IBarTruffle.md#procedures)

#### Overrides

[`ConfectionBase`](ConfectionBase.md).[`procedures`](ConfectionBase.md#procedures)

***

### singleBonBonDimensions

#### Get Signature

> **get** **singleBonBonDimensions**(): [`IBonBonDimensions`](../../Entities/namespaces/Confections/interfaces/IBonBonDimensions.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/barTruffle.ts:126](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/barTruffle.ts#L126)

Single bonbon dimensions for cutting (from golden version).

##### Returns

[`IBonBonDimensions`](../../Entities/namespaces/Confections/interfaces/IBonBonDimensions.md)

Single bonbon dimensions from the golden version

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`singleBonBonDimensions`](../interfaces/IBarTruffle.md#singlebonbondimensions)

***

### tags

#### Get Signature

> **get** **tags**(): readonly `string`[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:158](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L158)

Base tags for searching/filtering (version may add more via additionalTags)

##### Returns

readonly `string`[] \| `undefined`

Base tags for searching/filtering (version may add more)

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`tags`](../interfaces/IBarTruffle.md#tags)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`tags`](ConfectionBase.md#tags)

***

### urls

#### Get Signature

> **get** **urls**(): readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:165](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L165)

Base URLs (version may add more via additionalUrls)

##### Returns

readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[] \| `undefined`

Base URLs (version may add more)

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`urls`](../interfaces/IBarTruffle.md#urls)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`urls`](ConfectionBase.md#urls)

***

### versions

#### Get Signature

> **get** **versions**(): readonly `TVersion`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:258](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L258)

All versions - resolved.
Resolved lazily on first access.

##### Throws

if version creation fails - prefer getVersions() for proper error handling

##### Returns

readonly `TVersion`[]

All versions - resolved.

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`versions`](../interfaces/IBarTruffle.md#versions)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`versions`](ConfectionBase.md#versions)

***

### yield

#### Get Signature

> **get** **yield**(): [`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:190](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L190)

Yield specification from the golden version

##### Returns

[`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)

Yield specification from the golden version

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`yield`](../interfaces/IBarTruffle.md#yield)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`yield`](ConfectionBase.md#yield)

## Methods

### getEffectiveTags()

> **getEffectiveTags**(`version?`): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:331](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L331)

Gets effective tags for a specific version (base tags + version's additional tags).

#### Parameters

##### version?

[`AnyConfectionVersionEntity`](../../Entities/type-aliases/AnyConfectionVersionEntity.md)

The version to get tags for (defaults to golden version)

#### Returns

readonly `string`[]

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`getEffectiveTags`](../interfaces/IBarTruffle.md#geteffectivetags)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`getEffectiveTags`](ConfectionBase.md#geteffectivetags)

***

### getEffectiveUrls()

> **getEffectiveUrls**(`version?`): readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:343](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L343)

Gets effective URLs for a specific version (base URLs + version's additional URLs).

#### Parameters

##### version?

[`AnyConfectionVersionEntity`](../../Entities/type-aliases/AnyConfectionVersionEntity.md)

The version to get URLs for (defaults to golden version)

#### Returns

readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`getEffectiveUrls`](../interfaces/IBarTruffle.md#geteffectiveurls)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`getEffectiveUrls`](ConfectionBase.md#geteffectiveurls)

***

### getGoldenVersion()

> **getGoldenVersion**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:216](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L216)

Gets the golden (default) version - resolved.
Resolved lazily on first access.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md)\>

Result with golden version, or Failure if creation fails

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`getGoldenVersion`](ConfectionBase.md#getgoldenversion)

***

### getVersion()

> **getVersion**(`versionSpec`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:267](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L267)

Gets a specific version by version specifier.

#### Parameters

##### versionSpec

[`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

The version specifier to find

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md)\>

Success with runtime version, or Failure if not found or creation fails

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`getVersion`](../interfaces/IBarTruffle.md#getversion)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`getVersion`](ConfectionBase.md#getversion)

***

### getVersions()

> **getVersions**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:241](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L241)

Gets all versions - resolved.
Resolved lazily on first access.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md)[]\>

Result with all versions, or Failure if any version creation fails

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`getVersions`](ConfectionBase.md#getversions)

***

### isBarTruffle()

> **isBarTruffle**(): `this is BarTruffle`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:366](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L366)

Returns true if this is a bar truffle confection.

#### Returns

`this is BarTruffle`

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`isBarTruffle`](../interfaces/IBarTruffle.md#isbartruffle)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`isBarTruffle`](ConfectionBase.md#isbartruffle)

***

### isMoldedBonBon()

> **isMoldedBonBon**(): `this is MoldedBonBon`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:359](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L359)

Returns true if this is a molded bonbon confection.

#### Returns

`this is MoldedBonBon`

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`isMoldedBonBon`](../interfaces/IBarTruffle.md#ismoldedbonbon)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`isMoldedBonBon`](ConfectionBase.md#ismoldedbonbon)

***

### isRolledTruffle()

> **isRolledTruffle**(): `this is RolledTruffle`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:373](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L373)

Returns true if this is a rolled truffle confection.

#### Returns

`this is RolledTruffle`

#### Implementation of

[`IBarTruffle`](../interfaces/IBarTruffle.md).[`isRolledTruffle`](../interfaces/IBarTruffle.md#isrolledtruffle)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`isRolledTruffle`](ConfectionBase.md#isrolledtruffle)

***

### create()

> `static` **create**(`context`, `id`, `confection`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`BarTruffle`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/barTruffle.ts:77](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/barTruffle.ts#L77)

Factory method for creating a BarTruffle.

#### Parameters

##### context

[`IConfectionContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

The runtime context

##### id

[`ConfectionId`](../../../../type-aliases/ConfectionId.md)

The confection ID

##### confection

[`IBarTruffleEntity`](../../Entities/interfaces/IBarTruffleEntity.md)

The bar truffle data

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`BarTruffle`\>

Success with BarTruffle
