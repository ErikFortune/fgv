[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / MoldedBonBonVersion

# Class: MoldedBonBonVersion

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts:49](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts#L49)

A resolved view of a molded bonbon version with all references resolved.

## Extends

- [`ConfectionVersionBase`](ConfectionVersionBase.md)\<[`IMoldedBonBon`](../interfaces/IMoldedBonBon.md), [`IMoldedBonBonVersionEntity`](../../Entities/interfaces/IMoldedBonBonVersionEntity.md)\>

## Implements

- [`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md)

## Properties

### \_confectionId

> `protected` `readonly` **\_confectionId**: [`ConfectionId`](../../../../type-aliases/ConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:57](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L57)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`_confectionId`](ConfectionVersionBase.md#_confectionid)

***

### \_context

> `protected` `readonly` **\_context**: [`IConfectionContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:56](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L56)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`_context`](ConfectionVersionBase.md#_context)

***

### \_entity

> `protected` `readonly` **\_entity**: [`IMoldedBonBonVersionEntity`](../../Entities/interfaces/IMoldedBonBonVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:58](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L58)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`_entity`](ConfectionVersionBase.md#_entity)

## Accessors

### additionalChocolates

#### Get Signature

> **get** **additionalChocolates**(): readonly [`IResolvedAdditionalChocolate`](../interfaces/IResolvedAdditionalChocolate.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts:229](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts#L229)

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

> **get** **confection**(): `TConfection`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:109](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L109)

The parent confection - resolved.
Enables navigation: `version.confection.name`

##### Returns

`TConfection`

The parent confection - resolved.
Enables navigation: `version.confection.name`

#### Implementation of

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`confection`](../interfaces/IMoldedBonBonVersion.md#confection)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`confection`](ConfectionVersionBase.md#confection)

***

### confectionId

#### Get Signature

> **get** **confectionId**(): [`ConfectionId`](../../../../type-aliases/ConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:101](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L101)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:121](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L121)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:94](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L94)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:147](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L147)

Optional decorations for this version.

##### Returns

readonly [`IConfectionDecoration`](../../Entities/namespaces/Confections/interfaces/IConfectionDecoration.md)[] \| `undefined`

Optional decorations for this version.

#### Implementation of

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`decorations`](../interfaces/IMoldedBonBonVersion.md#decorations)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`decorations`](ConfectionVersionBase.md#decorations)

***

### effectiveTags

#### Get Signature

> **get** **effectiveTags**(): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:312](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L312)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:322](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L322)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts:257](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts#L257)

Gets the underlying molded bonbon version entity data.

##### Returns

[`IMoldedBonBonVersionEntity`](../../Entities/interfaces/IMoldedBonBonVersionEntity.md)

Gets the underlying recipe version entity data.

#### Implementation of

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`entity`](../interfaces/IMoldedBonBonVersion.md#entity)

#### Overrides

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`entity`](ConfectionVersionBase.md#entity)

***

### fillings

#### Get Signature

> **get** **fillings**(): readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:201](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L201)

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

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`fillings`](ConfectionVersionBase.md#fillings)

***

### molds

#### Get Signature

> **get** **molds**(): [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionMoldRef`](../interfaces/IResolvedConfectionMoldRef.md), [`MoldId`](../../../../type-aliases/MoldId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts:135](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts#L135)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:154](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L154)

Optional categorized notes about this version.

##### Returns

readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[] \| `undefined`

Optional notes about this version.

#### Implementation of

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`notes`](../interfaces/IMoldedBonBonVersion.md#notes)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`notes`](ConfectionVersionBase.md#notes)

***

### preferredMold

#### Get Signature

> **get** **preferredMold**(): [`IResolvedConfectionMoldRef`](../interfaces/IResolvedConfectionMoldRef.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts:242](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts#L242)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts:250](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts#L250)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:250](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L250)

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

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`procedures`](ConfectionVersionBase.md#procedures)

***

### shellChocolate

#### Get Signature

> **get** **shellChocolate**(): [`IResolvedChocolateSpec`](../interfaces/IResolvedChocolateSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts:173](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts#L173)

Resolved shell chocolate specification (lazy-loaded).

##### Throws

if resolution fails - prefer getShellChocolate() for proper error handling

##### Returns

[`IResolvedChocolateSpec`](../interfaces/IResolvedChocolateSpec.md)

Resolved shell chocolate specification

#### Implementation of

[`IMoldedBonBonVersion`](../interfaces/IMoldedBonBonVersion.md).[`shellChocolate`](../interfaces/IMoldedBonBonVersion.md#shellchocolate)

***

### versionSpec

#### Get Signature

> **get** **versionSpec**(): [`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:87](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L87)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:140](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L140)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts:182](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts#L182)

Gets resolved additional chocolates (lazy-loaded).

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IResolvedAdditionalChocolate`](../interfaces/IResolvedAdditionalChocolate.md)[]\>

Result with resolved additional chocolates (may be empty array), or Failure if resolution fails

***

### getFillings()

> **getFillings**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:167](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L167)

Gets resolved filling slots for this version.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[]\>

Result with resolved fillings (empty array if none), or Failure if resolution fails

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`getFillings`](ConfectionVersionBase.md#getfillings)

***

### getMolds()

> **getMolds**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionMoldRef`](../interfaces/IResolvedConfectionMoldRef.md), [`MoldId`](../../../../type-aliases/MoldId.md)\>\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts:103](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts#L103)

Gets resolved molds with preferred selection (lazy-loaded).

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionMoldRef`](../interfaces/IResolvedConfectionMoldRef.md), [`MoldId`](../../../../type-aliases/MoldId.md)\>\>

Result with resolved molds, or Failure if resolution fails

***

### getProcedures()

> **getProcedures**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\> \| `undefined`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:211](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L211)

Gets resolved procedures for this version.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\> \| `undefined`\>

Result with resolved procedures (undefined if none), or Failure if resolution fails

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`getProcedures`](ConfectionVersionBase.md#getprocedures)

***

### getShellChocolate()

> **getShellChocolate**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IResolvedChocolateSpec`](../interfaces/IResolvedChocolateSpec.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts:144](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts#L144)

Gets resolved shell chocolate specification (lazy-loaded).

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IResolvedChocolateSpec`](../interfaces/IResolvedChocolateSpec.md)\>

Result with resolved chocolate spec, or Failure if resolution fails

***

### isBarTruffleVersion()

> **isBarTruffleVersion**(): `this is BarTruffleVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:342](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L342)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:335](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L335)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:349](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L349)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts:81](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/moldedBonBonVersion.ts#L81)

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
