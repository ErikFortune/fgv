[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / BarTruffleVersion

# Class: BarTruffleVersion

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/barTruffleVersion.ts:47](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/barTruffleVersion.ts#L47)

A resolved view of a bar truffle version with all references resolved.

## Extends

- [`ConfectionVersionBase`](ConfectionVersionBase.md)

## Implements

- [`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md)

## Properties

### \_confectionId

> `protected` `readonly` **\_confectionId**: [`ConfectionId`](../../../../type-aliases/ConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:51](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L51)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`_confectionId`](ConfectionVersionBase.md#_confectionid)

***

### \_context

> `protected` `readonly` **\_context**: [`IConfectionContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:50](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L50)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`_context`](ConfectionVersionBase.md#_context)

***

### \_version

> `protected` `readonly` **\_version**: [`AnyConfectionVersionEntity`](../../Entities/type-aliases/AnyConfectionVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:52](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L52)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`_version`](ConfectionVersionBase.md#_version)

## Accessors

### confection

#### Get Signature

> **get** **confection**(): [`IBarTruffle`](../interfaces/IBarTruffle.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/barTruffleVersion.ts:90](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/barTruffleVersion.ts#L90)

Parent confection narrowed to bar truffle type.

##### Returns

[`IBarTruffle`](../interfaces/IBarTruffle.md)

Parent confection narrowed to bar truffle type

#### Implementation of

[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md).[`confection`](../interfaces/IBarTruffleVersion.md#confection)

#### Overrides

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`confection`](ConfectionVersionBase.md#confection)

***

### confectionId

#### Get Signature

> **get** **confectionId**(): [`ConfectionId`](../../../../type-aliases/ConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:99](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L99)

The parent confection ID.

##### Returns

[`ConfectionId`](../../../../type-aliases/ConfectionId.md)

The parent confection ID.

#### Implementation of

[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md).[`confectionId`](../interfaces/IBarTruffleVersion.md#confectionid)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`confectionId`](ConfectionVersionBase.md#confectionid)

***

### context

#### Get Signature

> **get** **context**(): [`IConfectionContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:119](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L119)

The runtime context for navigation and resource resolution.
Used by editing sessions to access library resources.

##### Returns

[`IConfectionContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`context`](ConfectionVersionBase.md#context)

***

### createdDate

#### Get Signature

> **get** **createdDate**(): `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:92](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L92)

Date this version was created (ISO 8601 format).

##### Returns

`string`

Date this version was created (ISO 8601 format).

#### Implementation of

[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md).[`createdDate`](../interfaces/IBarTruffleVersion.md#createddate)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`createdDate`](ConfectionVersionBase.md#createddate)

***

### decorations

#### Get Signature

> **get** **decorations**(): readonly [`IConfectionDecoration`](../../Entities/namespaces/Confections/interfaces/IConfectionDecoration.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:145](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L145)

Optional decorations for this version.

##### Returns

readonly [`IConfectionDecoration`](../../Entities/namespaces/Confections/interfaces/IConfectionDecoration.md)[] \| `undefined`

Optional decorations for this version.

#### Implementation of

[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md).[`decorations`](../interfaces/IBarTruffleVersion.md#decorations)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`decorations`](ConfectionVersionBase.md#decorations)

***

### effectiveTags

#### Get Signature

> **get** **effectiveTags**(): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:303](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L303)

Effective tags for this version (base confection tags + version's additional tags).

##### Returns

readonly `string`[]

Effective tags for this version (base confection tags + version's additional tags).

#### Implementation of

[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md).[`effectiveTags`](../interfaces/IBarTruffleVersion.md#effectivetags)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`effectiveTags`](ConfectionVersionBase.md#effectivetags)

***

### effectiveUrls

#### Get Signature

> **get** **effectiveUrls**(): readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:313](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L313)

Effective URLs for this version (base confection URLs + version's additional URLs).

##### Returns

readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Effective URLs for this version (base confection URLs + version's additional URLs).

#### Implementation of

[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md).[`effectiveUrls`](../interfaces/IBarTruffleVersion.md#effectiveurls)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`effectiveUrls`](ConfectionVersionBase.md#effectiveurls)

***

### enrobingChocolate

#### Get Signature

> **get** **enrobingChocolate**(): [`IResolvedChocolateSpec`](../interfaces/IResolvedChocolateSpec.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/barTruffleVersion.ts:146](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/barTruffleVersion.ts#L146)

Resolved enrobing chocolate specification (lazy-loaded).

##### Throws

if resolution fails - prefer getEnrobingChocolate() for proper error handling

##### Returns

[`IResolvedChocolateSpec`](../interfaces/IResolvedChocolateSpec.md) \| `undefined`

Resolved enrobing chocolate specification (optional)

#### Implementation of

[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md).[`enrobingChocolate`](../interfaces/IBarTruffleVersion.md#enrobingchocolate)

***

### entity

#### Get Signature

> **get** **entity**(): [`IBarTruffleVersionEntity`](../../Entities/interfaces/IBarTruffleVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/barTruffleVersion.ts:165](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/barTruffleVersion.ts#L165)

Gets the underlying bar truffle version data entity.

##### Returns

[`IBarTruffleVersionEntity`](../../Entities/interfaces/IBarTruffleVersionEntity.md)

Entity data typed to [IBarTruffleVersionEntity](../../Entities/interfaces/IBarTruffleVersionEntity.md).

#### Implementation of

[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md).[`entity`](../interfaces/IBarTruffleVersion.md#entity)

#### Overrides

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`entity`](ConfectionVersionBase.md#entity)

***

### fillings

#### Get Signature

> **get** **fillings**(): readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:198](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L198)

Resolved filling slots for this version.
Undefined if the version has no fillings.

##### Throws

if resolution fails - prefer getFillings() for proper error handling

##### Returns

readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[] \| `undefined`

Resolved filling slots for this version.
Undefined if the version has no fillings.

#### Implementation of

[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md).[`fillings`](../interfaces/IBarTruffleVersion.md#fillings)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`fillings`](ConfectionVersionBase.md#fillings)

***

### frameDimensions

#### Get Signature

> **get** **frameDimensions**(): [`IFrameDimensions`](../../Entities/namespaces/Confections/interfaces/IFrameDimensions.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/barTruffleVersion.ts:101](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/barTruffleVersion.ts#L101)

Frame dimensions for ganache slab.

##### Returns

[`IFrameDimensions`](../../Entities/namespaces/Confections/interfaces/IFrameDimensions.md)

Frame dimensions for ganache slab

#### Implementation of

[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md).[`frameDimensions`](../interfaces/IBarTruffleVersion.md#framedimensions)

***

### notes

#### Get Signature

> **get** **notes**(): readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:152](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L152)

Optional categorized notes about this version.

##### Returns

readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[] \| `undefined`

Optional notes about this version.

#### Implementation of

[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md).[`notes`](../interfaces/IBarTruffleVersion.md#notes)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`notes`](ConfectionVersionBase.md#notes)

***

### preferredProcedure

#### Get Signature

> **get** **preferredProcedure**(): [`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/barTruffleVersion.ts:158](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/barTruffleVersion.ts#L158)

Gets the preferred procedure, falling back to first available.

##### Returns

[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md) \| `undefined`

Gets the preferred procedure, falling back to first available

#### Implementation of

[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md).[`preferredProcedure`](../interfaces/IBarTruffleVersion.md#preferredprocedure)

***

### procedures

#### Get Signature

> **get** **procedures**(): [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\> \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:246](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L246)

Resolved procedures for this version.
Undefined if the version has no procedures.

##### Throws

if resolution fails - prefer getProcedures() for proper error handling

##### Returns

[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\> \| `undefined`

Resolved procedures for this version.
Undefined if the version has no procedures.

#### Implementation of

[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md).[`procedures`](../interfaces/IBarTruffleVersion.md#procedures)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`procedures`](ConfectionVersionBase.md#procedures)

***

### singleBonBonDimensions

#### Get Signature

> **get** **singleBonBonDimensions**(): [`IBonBonDimensions`](../../Entities/namespaces/Confections/interfaces/IBonBonDimensions.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/barTruffleVersion.ts:108](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/barTruffleVersion.ts#L108)

Single bonbon dimensions for cutting.

##### Returns

[`IBonBonDimensions`](../../Entities/namespaces/Confections/interfaces/IBonBonDimensions.md)

Single bonbon dimensions for cutting

#### Implementation of

[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md).[`singleBonBonDimensions`](../interfaces/IBarTruffleVersion.md#singlebonbondimensions)

***

### version

#### Get Signature

> **get** **version**(): [`AnyConfectionVersionEntity`](../../Entities/type-aliases/AnyConfectionVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:127](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L127)

The underlying confection version.
Use this to get the version data entity for persistence or journaling.

##### Returns

[`AnyConfectionVersionEntity`](../../Entities/type-aliases/AnyConfectionVersionEntity.md)

The underlying confection version.
Use this to get the version entity data for persistence or journaling.

#### Implementation of

[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md).[`version`](../interfaces/IBarTruffleVersion.md#version)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`version`](ConfectionVersionBase.md#version)

***

### versionSpec

#### Get Signature

> **get** **versionSpec**(): [`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:85](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L85)

Version specifier for this version.

##### Returns

[`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

Version specifier for this version.

#### Implementation of

[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md).[`versionSpec`](../interfaces/IBarTruffleVersion.md#versionspec)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`versionSpec`](ConfectionVersionBase.md#versionspec)

***

### yield

#### Get Signature

> **get** **yield**(): [`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:138](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L138)

Yield specification for this version.

##### Returns

[`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)

Yield specification for this version.

#### Implementation of

[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md).[`yield`](../interfaces/IBarTruffleVersion.md#yield)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`yield`](ConfectionVersionBase.md#yield)

## Methods

### getEnrobingChocolate()

> **getEnrobingChocolate**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IResolvedChocolateSpec`](../interfaces/IResolvedChocolateSpec.md) \| `undefined`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/barTruffleVersion.ts:117](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/barTruffleVersion.ts#L117)

Gets resolved enrobing chocolate specification (lazy-loaded).

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IResolvedChocolateSpec`](../interfaces/IResolvedChocolateSpec.md) \| `undefined`\>

Result with resolved chocolate spec (or undefined if not specified), or Failure if resolution fails

***

### getFillings()

> **getFillings**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:165](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L165)

Gets resolved filling slots for this version.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[]\>

Result with resolved fillings (empty array if none), or Failure if resolution fails

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`getFillings`](ConfectionVersionBase.md#getfillings)

***

### getProcedures()

> **getProcedures**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\> \| `undefined`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:208](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L208)

Gets resolved procedures for this version.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\> \| `undefined`\>

Result with resolved procedures (undefined if none), or Failure if resolution fails

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`getProcedures`](ConfectionVersionBase.md#getprocedures)

***

### isBarTruffleVersion()

> **isBarTruffleVersion**(): `this is BarTruffleVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:333](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L333)

Returns true if this is a bar truffle version.

#### Returns

`this is BarTruffleVersion`

#### Implementation of

[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md).[`isBarTruffleVersion`](../interfaces/IBarTruffleVersion.md#isbartruffleversion)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`isBarTruffleVersion`](ConfectionVersionBase.md#isbartruffleversion)

***

### isMoldedBonBonVersion()

> **isMoldedBonBonVersion**(): `this is MoldedBonBonVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:326](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L326)

Returns true if this is a molded bonbon version.

#### Returns

`this is MoldedBonBonVersion`

#### Implementation of

[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md).[`isMoldedBonBonVersion`](../interfaces/IBarTruffleVersion.md#ismoldedbonbonversion)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`isMoldedBonBonVersion`](ConfectionVersionBase.md#ismoldedbonbonversion)

***

### isRolledTruffleVersion()

> **isRolledTruffleVersion**(): `this is RolledTruffleVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:340](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L340)

Returns true if this is a rolled truffle version.

#### Returns

`this is RolledTruffleVersion`

#### Implementation of

[`IBarTruffleVersion`](../interfaces/IBarTruffleVersion.md).[`isRolledTruffleVersion`](../interfaces/IBarTruffleVersion.md#isrolledtruffleversion)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`isRolledTruffleVersion`](ConfectionVersionBase.md#isrolledtruffleversion)

***

### create()

> `static` **create**(`context`, `confectionId`, `version`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`BarTruffleVersion`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/barTruffleVersion.ts:75](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/barTruffleVersion.ts#L75)

Factory method for creating a BarTruffleVersion.

#### Parameters

##### context

[`IConfectionContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

The runtime context

##### confectionId

[`ConfectionId`](../../../../type-aliases/ConfectionId.md)

The parent confection ID

##### version

[`IBarTruffleVersionEntity`](../../Entities/interfaces/IBarTruffleVersionEntity.md)

The bar truffle version data

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`BarTruffleVersion`\>

Success with BarTruffleVersion
