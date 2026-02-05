[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / RolledTruffleVersion

# Class: RolledTruffleVersion

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/rolledTruffleVersion.ts:49](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/rolledTruffleVersion.ts#L49)

A resolved view of a rolled truffle version with all references resolved.

## Extends

- [`ConfectionVersionBase`](ConfectionVersionBase.md)\<[`IRolledTruffle`](../interfaces/IRolledTruffle.md), [`IRolledTruffleVersionEntity`](../../Entities/interfaces/IRolledTruffleVersionEntity.md)\>

## Implements

- [`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md)

## Properties

### \_confectionId

> `protected` `readonly` **\_confectionId**: [`ConfectionId`](../../../../type-aliases/ConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:58](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L58)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`_confectionId`](ConfectionVersionBase.md#_confectionid)

***

### \_context

> `protected` `readonly` **\_context**: [`IConfectionContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:57](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L57)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`_context`](ConfectionVersionBase.md#_context)

***

### \_entity

> `protected` `readonly` **\_entity**: [`IRolledTruffleVersionEntity`](../../Entities/interfaces/IRolledTruffleVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:59](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L59)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`_entity`](ConfectionVersionBase.md#_entity)

## Accessors

### coatings

#### Get Signature

> **get** **coatings**(): [`IResolvedCoatings`](../interfaces/IResolvedCoatings.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/rolledTruffleVersion.ts:179](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/rolledTruffleVersion.ts#L179)

Resolved coatings specification (lazy-loaded).

##### Throws

if resolution fails - prefer getCoatings() for proper error handling

##### Returns

[`IResolvedCoatings`](../interfaces/IResolvedCoatings.md) \| `undefined`

Resolved coatings (optional)

#### Implementation of

[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md).[`coatings`](../interfaces/IRolledTruffleVersion.md#coatings)

***

### confection

#### Get Signature

> **get** **confection**(): `TConfection`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:110](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L110)

The parent confection - resolved.
Enables navigation: `version.confection.name`

##### Returns

`TConfection`

The parent confection - resolved.
Enables navigation: `version.confection.name`

#### Implementation of

[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md).[`confection`](../interfaces/IRolledTruffleVersion.md#confection)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`confection`](ConfectionVersionBase.md#confection)

***

### confectionId

#### Get Signature

> **get** **confectionId**(): [`ConfectionId`](../../../../type-aliases/ConfectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:102](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L102)

The parent confection ID.

##### Returns

[`ConfectionId`](../../../../type-aliases/ConfectionId.md)

The parent confection ID.

#### Implementation of

[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md).[`confectionId`](../interfaces/IRolledTruffleVersion.md#confectionid)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`confectionId`](ConfectionVersionBase.md#confectionid)

***

### context

#### Get Signature

> **get** **context**(): [`IConfectionContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:122](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L122)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:95](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L95)

Date this version was created (ISO 8601 format).

##### Returns

`string`

Date this version was created (ISO 8601 format).

#### Implementation of

[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md).[`createdDate`](../interfaces/IRolledTruffleVersion.md#createddate)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`createdDate`](ConfectionVersionBase.md#createddate)

***

### decorations

#### Get Signature

> **get** **decorations**(): readonly [`IConfectionDecoration`](../../Entities/namespaces/Confections/interfaces/IConfectionDecoration.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:148](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L148)

Optional decorations for this version.

##### Returns

readonly [`IConfectionDecoration`](../../Entities/namespaces/Confections/interfaces/IConfectionDecoration.md)[] \| `undefined`

Optional decorations for this version.

#### Implementation of

[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md).[`decorations`](../interfaces/IRolledTruffleVersion.md#decorations)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`decorations`](ConfectionVersionBase.md#decorations)

***

### effectiveTags

#### Get Signature

> **get** **effectiveTags**(): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:313](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L313)

Effective tags for this version (base confection tags + version's additional tags).

##### Returns

readonly `string`[]

Effective tags for this version (base confection tags + version's additional tags).

#### Implementation of

[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md).[`effectiveTags`](../interfaces/IRolledTruffleVersion.md#effectivetags)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`effectiveTags`](ConfectionVersionBase.md#effectivetags)

***

### effectiveUrls

#### Get Signature

> **get** **effectiveUrls**(): readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:323](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L323)

Effective URLs for this version (base confection URLs + version's additional URLs).

##### Returns

readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Effective URLs for this version (base confection URLs + version's additional URLs).

#### Implementation of

[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md).[`effectiveUrls`](../interfaces/IRolledTruffleVersion.md#effectiveurls)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`effectiveUrls`](ConfectionVersionBase.md#effectiveurls)

***

### enrobingChocolate

#### Get Signature

> **get** **enrobingChocolate**(): [`IResolvedChocolateSpec`](../interfaces/IResolvedChocolateSpec.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/rolledTruffleVersion.ts:135](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/rolledTruffleVersion.ts#L135)

Resolved enrobing chocolate specification (lazy-loaded).

##### Throws

if resolution fails - prefer getEnrobingChocolate() for proper error handling

##### Returns

[`IResolvedChocolateSpec`](../interfaces/IResolvedChocolateSpec.md) \| `undefined`

Resolved enrobing chocolate specification (optional)

#### Implementation of

[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md).[`enrobingChocolate`](../interfaces/IRolledTruffleVersion.md#enrobingchocolate)

***

### entity

#### Get Signature

> **get** **entity**(): [`IRolledTruffleVersionEntity`](../../Entities/interfaces/IRolledTruffleVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/rolledTruffleVersion.ts:194](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/rolledTruffleVersion.ts#L194)

Gets the underlying rolled truffle version entity data.

##### Returns

[`IRolledTruffleVersionEntity`](../../Entities/interfaces/IRolledTruffleVersionEntity.md)

Gets the underlying recipe version entity data.

#### Implementation of

[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md).[`entity`](../interfaces/IRolledTruffleVersion.md#entity)

#### Overrides

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`entity`](ConfectionVersionBase.md#entity)

***

### fillings

#### Get Signature

> **get** **fillings**(): readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:202](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L202)

Resolved filling slots for this version.
Undefined if the version has no fillings.

##### Throws

if resolution fails - prefer getFillings() for proper error handling

##### Returns

readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[] \| `undefined`

Resolved filling slots for this version.
Undefined if the version has no fillings.

#### Implementation of

[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md).[`fillings`](../interfaces/IRolledTruffleVersion.md#fillings)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`fillings`](ConfectionVersionBase.md#fillings)

***

### notes

#### Get Signature

> **get** **notes**(): readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:155](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L155)

Optional categorized notes about this version.

##### Returns

readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[] \| `undefined`

Optional notes about this version.

#### Implementation of

[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md).[`notes`](../interfaces/IRolledTruffleVersion.md#notes)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`notes`](ConfectionVersionBase.md#notes)

***

### preferredProcedure

#### Get Signature

> **get** **preferredProcedure**(): [`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/rolledTruffleVersion.ts:187](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/rolledTruffleVersion.ts#L187)

Gets the preferred procedure, falling back to first available.

##### Returns

[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md) \| `undefined`

Gets the preferred procedure, falling back to first available

#### Implementation of

[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md).[`preferredProcedure`](../interfaces/IRolledTruffleVersion.md#preferredprocedure)

***

### procedures

#### Get Signature

> **get** **procedures**(): [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\> \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:251](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L251)

Resolved procedures for this version.
Undefined if the version has no procedures.

##### Throws

if resolution fails - prefer getProcedures() for proper error handling

##### Returns

[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\> \| `undefined`

Resolved procedures for this version.
Undefined if the version has no procedures.

#### Implementation of

[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md).[`procedures`](../interfaces/IRolledTruffleVersion.md#procedures)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`procedures`](ConfectionVersionBase.md#procedures)

***

### versionSpec

#### Get Signature

> **get** **versionSpec**(): [`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:88](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L88)

Version specifier for this version.

##### Returns

[`ConfectionVersionSpec`](../../../../type-aliases/ConfectionVersionSpec.md)

Version specifier for this version.

#### Implementation of

[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md).[`versionSpec`](../interfaces/IRolledTruffleVersion.md#versionspec)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`versionSpec`](ConfectionVersionBase.md#versionspec)

***

### yield

#### Get Signature

> **get** **yield**(): [`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:141](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L141)

Yield specification for this version.

##### Returns

[`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)

Yield specification for this version.

#### Implementation of

[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md).[`yield`](../interfaces/IRolledTruffleVersion.md#yield)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`yield`](ConfectionVersionBase.md#yield)

## Methods

### getCoatings()

> **getCoatings**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IResolvedCoatings`](../interfaces/IResolvedCoatings.md) \| `undefined`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/rolledTruffleVersion.ts:144](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/rolledTruffleVersion.ts#L144)

Gets resolved coatings specification (lazy-loaded).

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IResolvedCoatings`](../interfaces/IResolvedCoatings.md) \| `undefined`\>

Result with resolved coatings (or undefined if not specified), or Failure if resolution fails

***

### getEnrobingChocolate()

> **getEnrobingChocolate**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IResolvedChocolateSpec`](../interfaces/IResolvedChocolateSpec.md) \| `undefined`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/rolledTruffleVersion.ts:101](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/rolledTruffleVersion.ts#L101)

Gets resolved enrobing chocolate specification (lazy-loaded).

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IResolvedChocolateSpec`](../interfaces/IResolvedChocolateSpec.md) \| `undefined`\>

Result with resolved chocolate spec (or undefined if not specified), or Failure if resolution fails

***

### getFillings()

> **getFillings**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:168](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L168)

Gets resolved filling slots for this version.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IResolvedFillingSlot`](../interfaces/IResolvedFillingSlot.md)[]\>

Result with resolved fillings (empty array if none), or Failure if resolution fails

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`getFillings`](ConfectionVersionBase.md#getfillings)

***

### getProcedures()

> **getProcedures**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\> \| `undefined`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:212](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L212)

Gets resolved procedures for this version.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IResolvedConfectionProcedure`](../interfaces/IResolvedConfectionProcedure.md), [`ProcedureId`](../../../../type-aliases/ProcedureId.md)\> \| `undefined`\>

Result with resolved procedures (undefined if none), or Failure if resolution fails

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`getProcedures`](ConfectionVersionBase.md#getprocedures)

***

### isBarTruffleVersion()

> **isBarTruffleVersion**(): `this is BarTruffleVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:343](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L343)

Returns true if this is a bar truffle version.

#### Returns

`this is BarTruffleVersion`

#### Implementation of

[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md).[`isBarTruffleVersion`](../interfaces/IRolledTruffleVersion.md#isbartruffleversion)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`isBarTruffleVersion`](ConfectionVersionBase.md#isbartruffleversion)

***

### isMoldedBonBonVersion()

> **isMoldedBonBonVersion**(): `this is MoldedBonBonVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:336](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L336)

Returns true if this is a molded bonbon version.

#### Returns

`this is MoldedBonBonVersion`

#### Implementation of

[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md).[`isMoldedBonBonVersion`](../interfaces/IRolledTruffleVersion.md#ismoldedbonbonversion)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`isMoldedBonBonVersion`](ConfectionVersionBase.md#ismoldedbonbonversion)

***

### isRolledTruffleVersion()

> **isRolledTruffleVersion**(): `this is RolledTruffleVersion`

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts:350](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/confectionVersionBase.ts#L350)

Returns true if this is a rolled truffle version.

#### Returns

`this is RolledTruffleVersion`

#### Implementation of

[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md).[`isRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md#isrolledtruffleversion)

#### Inherited from

[`ConfectionVersionBase`](ConfectionVersionBase.md).[`isRolledTruffleVersion`](ConfectionVersionBase.md#isrolledtruffleversion)

***

### create()

> `static` **create**(`context`, `confectionId`, `version`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`RolledTruffleVersion`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/confections/versions/rolledTruffleVersion.ts:80](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/confections/versions/rolledTruffleVersion.ts#L80)

Factory method for creating a RolledTruffleVersion.

#### Parameters

##### context

[`IConfectionContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

The runtime context

##### confectionId

[`ConfectionId`](../../../../type-aliases/ConfectionId.md)

The parent confection ID

##### version

[`IRolledTruffleVersionEntity`](../../Entities/interfaces/IRolledTruffleVersionEntity.md)

The rolled truffle version data

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`RolledTruffleVersion`\>

Success with RolledTruffleVersion
