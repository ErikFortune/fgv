[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / RolledTruffle

# Class: RolledTruffle

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts:51](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts#L51)

A resolved view of a rolled truffle confection with navigation capabilities.
Immutable - does not allow modification of underlying data.

## Extends

- [`ConfectionBase`](ConfectionBase.md)

## Implements

- [`IRolledTruffle`](../interfaces/IRolledTruffle.md)

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

### baseId

#### Get Signature

> **get** **baseId**(): [`BaseConfectionId`](../../../../type-aliases/BaseConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:125](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L125)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts:165](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts#L165)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:118](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L118)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts:90](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts#L90)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:180](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L180)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:148](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L148)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:284](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L284)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:291](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L291)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts:158](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts#L158)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts:172](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts#L172)

Gets the underlying rolled truffle data entity

##### Returns

[`IRolledTruffleEntity`](../../Entities/interfaces/IRolledTruffleEntity.md)

Entity data typed to IRolledTruffle

#### Implementation of

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`entity`](../interfaces/IRolledTruffle.md#entity)

#### Overrides

[`ConfectionBase`](ConfectionBase.md).[`entity`](ConfectionBase.md#entity)

***

### fillings

#### Get Signature

> **get** **fillings**(): readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts:142](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts#L142)

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

> **get** **goldenVersion**(): [`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts:101](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts#L101)

Golden version typed as IRolledTruffleVersion.

##### Returns

[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md)

Golden version typed as IRuntimeRolledTruffleVersion

#### Implementation of

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`goldenVersion`](../interfaces/IRolledTruffle.md#goldenversion)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`goldenVersionSpec`](../interfaces/IRolledTruffle.md#goldenversionspec)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`id`](../interfaces/IRolledTruffle.md#id)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`id`](ConfectionBase.md#id)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`name`](../interfaces/IRolledTruffle.md#name)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`name`](ConfectionBase.md#name)

***

### procedures

#### Get Signature

> **get** **procedures**(): [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\> \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts:149](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts#L149)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:155](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L155)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts:162](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/confectionBase.ts#L162)

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

> **get** **versions**(): readonly [`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts:108](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts#L108)

All versions typed as IRolledTruffleVersion.

##### Returns

readonly [`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md)[]

All versions typed as IRuntimeRolledTruffleVersion

#### Implementation of

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`versions`](../interfaces/IRolledTruffle.md#versions)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`yield`](../interfaces/IRolledTruffle.md#yield)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`getEffectiveTags`](../interfaces/IRolledTruffle.md#geteffectivetags)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`getEffectiveUrls`](../interfaces/IRolledTruffle.md#geteffectiveurls)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`getEffectiveUrls`](ConfectionBase.md#geteffectiveurls)

***

### getVersion()

> **getVersion**(`versionSpec`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts:117](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts#L117)

Gets a specific version by version specifier.

#### Parameters

##### versionSpec

[`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

The version specifier to find

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md)\>

Success with typed runtime version, or Failure if not found

#### Implementation of

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`getVersion`](../interfaces/IRolledTruffle.md#getversion)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`isBarTruffle`](../interfaces/IRolledTruffle.md#isbartruffle)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`isMoldedBonBon`](../interfaces/IRolledTruffle.md#ismoldedbonbon)

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

[`IRolledTruffle`](../interfaces/IRolledTruffle.md).[`isRolledTruffle`](../interfaces/IRolledTruffle.md#isrolledtruffle)

#### Inherited from

[`ConfectionBase`](ConfectionBase.md).[`isRolledTruffle`](ConfectionBase.md#isrolledtruffle)

***

### create()

> `static` **create**(`context`, `id`, `confection`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`RolledTruffle`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts:75](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/rolledTruffle.ts#L75)

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
