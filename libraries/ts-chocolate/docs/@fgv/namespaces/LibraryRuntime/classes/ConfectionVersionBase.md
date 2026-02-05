[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / ConfectionVersionBase

# Abstract Class: ConfectionVersionBase

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:49](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L49)

Abstract base class for runtime confection versions.
Provides common properties and resolution logic shared by all confection version types.

## Extended by

- [`MoldedBonBonVersion`](MoldedBonBonVersion.md)
- [`BarTruffleVersion`](BarTruffleVersion.md)
- [`RolledTruffleVersion`](RolledTruffleVersion.md)

## Implements

- [`IConfectionVersionBase`](../interfaces/IConfectionVersionBase.md)

## Properties

### \_confectionId

> `protected` `readonly` **\_confectionId**: [`ConfectionId`](../../../../type-aliases/ConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:51](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L51)

***

### \_context

> `protected` `readonly` **\_context**: [`IConfectionContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:50](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L50)

***

### \_version

> `protected` `readonly` **\_version**: [`AnyConfectionVersionEntity`](../../Entities/type-aliases/AnyConfectionVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:52](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L52)

## Accessors

### confection

#### Get Signature

> **get** **confection**(): [`IConfectionBase`](../interfaces/IConfectionBase.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:107](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L107)

The parent confection - resolved.
Enables navigation: `version.confection.name`

##### Returns

[`IConfectionBase`](../interfaces/IConfectionBase.md)

The parent confection - resolved.
Enables navigation: `version.confection.name`

#### Implementation of

[`IConfectionVersionBase`](../interfaces/IConfectionVersionBase.md).[`confection`](../interfaces/IConfectionVersionBase.md#confection)

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

[`IConfectionVersionBase`](../interfaces/IConfectionVersionBase.md).[`confectionId`](../interfaces/IConfectionVersionBase.md#confectionid)

***

### context

#### Get Signature

> **get** **context**(): [`IConfectionContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:119](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L119)

The runtime context for navigation and resource resolution.
Used by editing sessions to access library resources.

##### Returns

[`IConfectionContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

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

[`IConfectionVersionBase`](../interfaces/IConfectionVersionBase.md).[`createdDate`](../interfaces/IConfectionVersionBase.md#createddate)

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

[`IConfectionVersionBase`](../interfaces/IConfectionVersionBase.md).[`decorations`](../interfaces/IConfectionVersionBase.md#decorations)

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

[`IConfectionVersionBase`](../interfaces/IConfectionVersionBase.md).[`effectiveTags`](../interfaces/IConfectionVersionBase.md#effectivetags)

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

[`IConfectionVersionBase`](../interfaces/IConfectionVersionBase.md).[`effectiveUrls`](../interfaces/IConfectionVersionBase.md#effectiveurls)

***

### entity

#### Get Signature

> **get** `abstract` **entity**(): [`AnyConfectionVersionEntity`](../../Entities/type-aliases/AnyConfectionVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:347](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L347)

Gets the underlying version data entity (read-only)

##### Returns

[`AnyConfectionVersionEntity`](../../Entities/type-aliases/AnyConfectionVersionEntity.md)

Gets the underlying recipe version entity data.

#### Implementation of

[`IConfectionVersionBase`](../interfaces/IConfectionVersionBase.md).[`entity`](../interfaces/IConfectionVersionBase.md#entity)

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

[`IConfectionVersionBase`](../interfaces/IConfectionVersionBase.md).[`fillings`](../interfaces/IConfectionVersionBase.md#fillings)

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

[`IConfectionVersionBase`](../interfaces/IConfectionVersionBase.md).[`notes`](../interfaces/IConfectionVersionBase.md#notes)

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

[`IConfectionVersionBase`](../interfaces/IConfectionVersionBase.md).[`procedures`](../interfaces/IConfectionVersionBase.md#procedures)

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

[`IConfectionVersionBase`](../interfaces/IConfectionVersionBase.md).[`version`](../interfaces/IConfectionVersionBase.md#version)

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

[`IConfectionVersionBase`](../interfaces/IConfectionVersionBase.md).[`versionSpec`](../interfaces/IConfectionVersionBase.md#versionspec)

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

[`IConfectionVersionBase`](../interfaces/IConfectionVersionBase.md).[`yield`](../interfaces/IConfectionVersionBase.md#yield)

## Methods

### getFillings()

> **getFillings**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:165](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L165)

Gets resolved filling slots for this version.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[]\>

Result with resolved fillings (empty array if none), or Failure if resolution fails

***

### getProcedures()

> **getProcedures**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\> \| `undefined`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:208](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L208)

Gets resolved procedures for this version.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\> \| `undefined`\>

Result with resolved procedures (undefined if none), or Failure if resolution fails

***

### isBarTruffleVersion()

> **isBarTruffleVersion**(): `this is BarTruffleVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:333](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L333)

Returns true if this is a bar truffle version.

#### Returns

`this is BarTruffleVersion`

#### Implementation of

[`IConfectionVersionBase`](../interfaces/IConfectionVersionBase.md).[`isBarTruffleVersion`](../interfaces/IConfectionVersionBase.md#isbartruffleversion)

***

### isMoldedBonBonVersion()

> **isMoldedBonBonVersion**(): `this is MoldedBonBonVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:326](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L326)

Returns true if this is a molded bonbon version.

#### Returns

`this is MoldedBonBonVersion`

#### Implementation of

[`IConfectionVersionBase`](../interfaces/IConfectionVersionBase.md).[`isMoldedBonBonVersion`](../interfaces/IConfectionVersionBase.md#ismoldedbonbonversion)

***

### isRolledTruffleVersion()

> **isRolledTruffleVersion**(): `this is RolledTruffleVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:340](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L340)

Returns true if this is a rolled truffle version.

#### Returns

`this is RolledTruffleVersion`

#### Implementation of

[`IConfectionVersionBase`](../interfaces/IConfectionVersionBase.md).[`isRolledTruffleVersion`](../interfaces/IConfectionVersionBase.md#isrolledtruffleversion)
