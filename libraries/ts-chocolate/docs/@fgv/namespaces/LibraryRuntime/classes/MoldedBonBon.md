[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / MoldedBonBon

# Class: MoldedBonBon

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts:52](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts#L52)

A resolved view of a molded bonbon confection with navigation capabilities.
Immutable - does not allow modification of underlying data.

## Extends

- [`ConfectionBase`](ConfectionBase.md)

## Implements

- [`IMoldedBonBon`](../interfaces/IMoldedBonBon.md)

## Properties

### \_baseId

> `protected` `readonly` **\_baseId**: [`BaseConfectionId`](../../../../type-aliases/BaseConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:67](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L67)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`_baseId`](ConfectionBase.md#_baseid)

***

### \_confection

> `protected` `readonly` **\_confection**: [`AnyConfectionEntity`](../../Entities/type-aliases/AnyConfectionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:65](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L65)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`_confection`](ConfectionBase.md#_confection)

***

### \_context

> `protected` `readonly` **\_context**: [`IConfectionContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:63](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L63)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`_context`](ConfectionBase.md#_context)

***

### \_goldenVersionEntity

> `protected` `readonly` **\_goldenVersionEntity**: [`AnyConfectionVersionEntity`](../../Entities/type-aliases/AnyConfectionVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:68](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L68)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`_goldenVersionEntity`](ConfectionBase.md#_goldenversionentity)

***

### \_id

> `protected` `readonly` **\_id**: [`ConfectionId`](../../../../type-aliases/ConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:64](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L64)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`_id`](ConfectionBase.md#_id)

***

### \_sourceId

> `protected` `readonly` **\_sourceId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:66](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L66)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`_sourceId`](ConfectionBase.md#_sourceid)

## Accessors

### additionalChocolates

#### Get Signature

> **get** **additionalChocolates**(): readonly [`IResolvedAdditionalChocolate`](../interfaces/IResolvedAdditionalChocolate.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts:173](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts#L173)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:125](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L125)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:118](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L118)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts:91](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts#L91)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:180](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L180)

Decorations from the golden version

##### Returns

readonly [`IConfectionDecoration`](../../Entities/namespaces/Confections/interfaces/IConfectionDecoration.md)[] \| `undefined`

Decorations from the golden version

#### Implementation of

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`decorations`](../interfaces/IMoldedBonBon.md#decorations)

#### Inherited from

[`RolledTruffle`](RolledTruffle.md).[`decorations`](RolledTruffle.md#decorations)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`description`](../interfaces/IMoldedBonBon.md#description)

#### Inherited from

[`RolledTruffle`](RolledTruffle.md).[`description`](RolledTruffle.md#description)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`effectiveTags`](../interfaces/IMoldedBonBon.md#effectivetags)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`effectiveTags`](ConfectionBase.md#effectivetags)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`effectiveUrls`](../interfaces/IMoldedBonBon.md#effectiveurls)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`effectiveUrls`](ConfectionBase.md#effectiveurls)

***

### entity

#### Get Signature

> **get** **entity**(): [`IMoldedBonBonEntity`](../../Entities/interfaces/IMoldedBonBonEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts:180](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts#L180)

Gets the underlying molded bonbon data entity

##### Returns

[`IMoldedBonBonEntity`](../../Entities/interfaces/IMoldedBonBonEntity.md)

Entity data typed to IMoldedBonBon

#### Implementation of

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`entity`](../interfaces/IMoldedBonBon.md#entity)

#### Overrides

[`ConfectionBase`](ConfectionBase.md).[`entity`](ConfectionBase.md#entity)

***

### fillings

#### Get Signature

> **get** **fillings**(): readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts:143](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts#L143)

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

> **get** **goldenVersion**(): [`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts:102](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts#L102)

Golden version typed as IMoldedBonBonVersion.

##### Returns

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md)

Golden version typed as IRuntimeMoldedBonBonVersion

#### Implementation of

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`goldenVersion`](../interfaces/IMoldedBonBon.md#goldenversion)

#### Overrides

[`ConfectionBase`](ConfectionBase.md).[`goldenVersion`](ConfectionBase.md#goldenversion)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`goldenVersionSpec`](../interfaces/IMoldedBonBon.md#goldenversionspec)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`goldenVersionSpec`](ConfectionBase.md#goldenversionspec)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`id`](../interfaces/IMoldedBonBon.md#id)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`id`](ConfectionBase.md#id)

***

### molds

#### Get Signature

> **get** **molds**(): [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionMoldRef`](../interfaces/IResolvedConfectionMoldRef.md), [`MoldId`](../../../../type-aliases/MoldId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts:159](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts#L159)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:141](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L141)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts:150](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts#L150)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts:166](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts#L166)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:155](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L155)

Base tags for searching/filtering (version may add more via additionalTags)

##### Returns

readonly `string`[] \| `undefined`

Base tags for searching/filtering (version may add more)

#### Implementation of

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`tags`](../interfaces/IMoldedBonBon.md#tags)

#### Inherited from

[`RolledTruffle`](RolledTruffle.md).[`tags`](RolledTruffle.md#tags)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`urls`](../interfaces/IMoldedBonBon.md#urls)

#### Inherited from

[`RolledTruffle`](RolledTruffle.md).[`urls`](RolledTruffle.md#urls)

***

### versions

#### Get Signature

> **get** **versions**(): readonly [`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts:109](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts#L109)

All versions typed as IMoldedBonBonVersion.

##### Returns

readonly [`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md)[]

All versions typed as IRuntimeMoldedBonBonVersion

#### Implementation of

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`versions`](../interfaces/IMoldedBonBon.md#versions)

#### Overrides

[`ConfectionBase`](ConfectionBase.md).[`versions`](ConfectionBase.md#versions)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`yield`](../interfaces/IMoldedBonBon.md#yield)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`yield`](ConfectionBase.md#yield)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`getEffectiveTags`](../interfaces/IMoldedBonBon.md#geteffectivetags)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`getEffectiveTags`](ConfectionBase.md#geteffectivetags)

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

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`getEffectiveUrls`](../interfaces/IMoldedBonBon.md#geteffectiveurls)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`getEffectiveUrls`](ConfectionBase.md#geteffectiveurls)

***

### getVersion()

> **getVersion**(`versionSpec`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts:118](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts#L118)

Gets a specific version by version specifier.

#### Parameters

##### versionSpec

[`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

The version specifier to find

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md)\>

Success with typed runtime version, or Failure if not found

#### Implementation of

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md).[`getVersion`](../interfaces/IMoldedBonBon.md#getversion)

#### Overrides

[`ConfectionBase`](ConfectionBase.md).[`getVersion`](ConfectionBase.md#getversion)

***

### isBarTruffle()

> **isBarTruffle**(): `this is BarTruffle`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:334](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L334)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:327](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L327)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:341](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L341)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts:76](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/moldedBonBon.ts#L76)

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
