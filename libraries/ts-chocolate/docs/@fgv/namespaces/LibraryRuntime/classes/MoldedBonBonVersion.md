[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / MoldedBonBonVersion

# Class: MoldedBonBonVersion

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts:49](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts#L49)

A resolved view of a molded bonbon version with all references resolved.

## Extends

- [`ConfectionVersionBase`](ConfectionVersionBase.md)

## Implements

- [`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md)

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

### additionalChocolates

#### Get Signature

> **get** **additionalChocolates**(): readonly [`IResolvedAdditionalChocolate`](../interfaces/IResolvedAdditionalChocolate.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts:220](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts#L220)

Resolved additional chocolates (lazy-loaded).

##### Throws

if resolution fails - prefer getAdditionalChocolates() for proper error handling

##### Returns

readonly [`IResolvedAdditionalChocolate`](../interfaces/IResolvedAdditionalChocolate.md)[] \| `undefined`

Resolved additional chocolates (optional)

#### Implementation of

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`additionalChocolates`](../interfaces/IMoldedBonBonVersion.md#additionalchocolates)

***

### confection

#### Get Signature

> **get** **confection**(): [`IMoldedBonBon`](../interfaces/IMoldedBonBon.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts:93](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts#L93)

Parent confection narrowed to molded bonbon type.

##### Returns

[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md)

Parent confection narrowed to molded bonbon type

#### Implementation of

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`confection`](../interfaces/IMoldedBonBonVersion.md#confection)

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

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`confectionId`](../interfaces/IMoldedBonBonVersion.md#confectionid)

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

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`createdDate`](../interfaces/IMoldedBonBonVersion.md#createddate)

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

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`decorations`](../interfaces/IMoldedBonBonVersion.md#decorations)

#### Inherited from

[`RolledTruffleVersion`](RolledTruffleVersion.md).[`decorations`](RolledTruffleVersion.md#decorations)

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

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`effectiveTags`](../interfaces/IMoldedBonBonVersion.md#effectivetags)

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

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`effectiveUrls`](../interfaces/IMoldedBonBonVersion.md#effectiveurls)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`effectiveUrls`](ConfectionVersionBase.md#effectiveurls)

***

### entity

#### Get Signature

> **get** **entity**(): [`IMoldedBonBonVersionEntity`](../../Entities/interfaces/IMoldedBonBonVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts:248](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts#L248)

Gets the underlying molded bonbon version entity data.

##### Returns

[`IMoldedBonBonVersionEntity`](../../Entities/interfaces/IMoldedBonBonVersionEntity.md)

Entity data typed to [IMoldedBonBonVersionEntity](../../Entities/interfaces/IMoldedBonBonVersionEntity.md).

#### Implementation of

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`entity`](../interfaces/IMoldedBonBonVersion.md#entity)

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

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`fillings`](../interfaces/IMoldedBonBonVersion.md#fillings)

#### Inherited from

[`RolledTruffleVersion`](RolledTruffleVersion.md).[`fillings`](RolledTruffleVersion.md#fillings)

***

### molds

#### Get Signature

> **get** **molds**(): [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionMoldRef`](../interfaces/IResolvedConfectionMoldRef.md), [`MoldId`](../../../../type-aliases/MoldId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts:137](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts#L137)

Resolved molds with preferred selection (lazy-loaded).

##### Throws

if resolution fails - prefer getMolds() for proper error handling

##### Returns

[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionMoldRef`](../interfaces/IResolvedConfectionMoldRef.md), [`MoldId`](../../../../type-aliases/MoldId.md)\>

Resolved molds with preferred selection

#### Implementation of

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`molds`](../interfaces/IMoldedBonBonVersion.md#molds)

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

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`notes`](../interfaces/IMoldedBonBonVersion.md#notes)

#### Inherited from

[`RolledTruffleVersion`](RolledTruffleVersion.md).[`notes`](RolledTruffleVersion.md#notes)

***

### preferredMold

#### Get Signature

> **get** **preferredMold**(): [`IResolvedConfectionMoldRef`](../interfaces/IResolvedConfectionMoldRef.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts:233](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts#L233)

Gets the preferred mold, falling back to first available.

##### Returns

[`IResolvedConfectionMoldRef`](../interfaces/IResolvedConfectionMoldRef.md) \| `undefined`

Gets the preferred mold, falling back to first available

#### Implementation of

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`preferredMold`](../interfaces/IMoldedBonBonVersion.md#preferredmold)

***

### preferredProcedure

#### Get Signature

> **get** **preferredProcedure**(): [`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts:241](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts#L241)

Gets the preferred procedure, falling back to first available.

##### Returns

[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md) \| `undefined`

Gets the preferred procedure, falling back to first available

#### Implementation of

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`preferredProcedure`](../interfaces/IMoldedBonBonVersion.md#preferredprocedure)

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

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`procedures`](../interfaces/IMoldedBonBonVersion.md#procedures)

#### Inherited from

[`RolledTruffleVersion`](RolledTruffleVersion.md).[`procedures`](RolledTruffleVersion.md#procedures)

***

### shellChocolate

#### Get Signature

> **get** **shellChocolate**(): [`IResolvedChocolateSpec`](../interfaces/IResolvedChocolateSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts:170](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts#L170)

Resolved shell chocolate specification (lazy-loaded).

##### Throws

if resolution fails - prefer getShellChocolate() for proper error handling

##### Returns

[`IResolvedChocolateSpec`](../interfaces/IResolvedChocolateSpec.md)

Resolved shell chocolate specification

#### Implementation of

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`shellChocolate`](../interfaces/IMoldedBonBonVersion.md#shellchocolate)

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

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`version`](../interfaces/IMoldedBonBonVersion.md#version)

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

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`versionSpec`](../interfaces/IMoldedBonBonVersion.md#versionspec)

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

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`yield`](../interfaces/IMoldedBonBonVersion.md#yield)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`yield`](ConfectionVersionBase.md#yield)

## Methods

### getAdditionalChocolates()

> **getAdditionalChocolates**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IResolvedAdditionalChocolate`](../interfaces/IResolvedAdditionalChocolate.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts:179](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts#L179)

Gets resolved additional chocolates (lazy-loaded).

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IResolvedAdditionalChocolate`](../interfaces/IResolvedAdditionalChocolate.md)[]\>

Result with resolved additional chocolates (may be empty array), or Failure if resolution fails

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

### getMolds()

> **getMolds**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionMoldRef`](../interfaces/IResolvedConfectionMoldRef.md), [`MoldId`](../../../../type-aliases/MoldId.md)\>\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts:106](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts#L106)

Gets resolved molds with preferred selection (lazy-loaded).

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionMoldRef`](../interfaces/IResolvedConfectionMoldRef.md), [`MoldId`](../../../../type-aliases/MoldId.md)\>\>

Result with resolved molds, or Failure if resolution fails

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

### getShellChocolate()

> **getShellChocolate**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IResolvedChocolateSpec`](../interfaces/IResolvedChocolateSpec.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts:146](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts#L146)

Gets resolved shell chocolate specification (lazy-loaded).

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IResolvedChocolateSpec`](../interfaces/IResolvedChocolateSpec.md)\>

Result with resolved chocolate spec, or Failure if resolution fails

***

### isBarTruffleVersion()

> **isBarTruffleVersion**(): `this is BarTruffleVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:333](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L333)

Returns true if this is a bar truffle version.

#### Returns

`this is BarTruffleVersion`

#### Implementation of

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`isBarTruffleVersion`](../interfaces/IMoldedBonBonVersion.md#isbartruffleversion)

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

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`isMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md#ismoldedbonbonversion)

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

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`isRolledTruffleVersion`](../interfaces/IMoldedBonBonVersion.md#isrolledtruffleversion)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`isRolledTruffleVersion`](ConfectionVersionBase.md#isrolledtruffleversion)

***

### create()

> `static` **create**(`context`, `confectionId`, `version`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`MoldedBonBonVersion`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts:78](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts#L78)

Factory method for creating a MoldedBonBonVersion.

#### Parameters

##### context

[`IConfectionContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

The runtime context

##### confectionId

[`ConfectionId`](../../../../type-aliases/ConfectionId.md)

The parent confection ID

##### version

[`IMoldedBonBonVersionEntity`](../../Entities/interfaces/IMoldedBonBonVersionEntity.md)

The molded bonbon version data

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`MoldedBonBonVersion`\>

Success with MoldedBonBonVersion
