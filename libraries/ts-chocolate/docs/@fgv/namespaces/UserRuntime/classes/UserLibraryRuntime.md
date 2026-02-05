[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [UserRuntime](../README.md) / UserLibraryRuntime

# Class: UserLibraryRuntime

Defined in: [ts-chocolate/src/packlets/user-runtime/userLibraryRuntime.ts:54](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/user-runtime/userLibraryRuntime.ts#L54)

Implementation of user library runtime materialization.

Provides:
- On-demand materialization of persisted sessions
- Caching of materialized sessions
- Creation and persistence of new sessions

## Implements

- [`IUserLibraryRuntime`](../interfaces/IUserLibraryRuntime.md)

## Accessors

### materializedSessions

#### Get Signature

> **get** **materializedSessions**(): `ReadonlyMap`\<[`SessionId`](../../../../type-aliases/SessionId.md), [`AnyMaterializedSession`](../type-aliases/AnyMaterializedSession.md)\>

Defined in: [ts-chocolate/src/packlets/user-runtime/userLibraryRuntime.ts:201](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/user-runtime/userLibraryRuntime.ts#L201)

All currently materialized sessions.

##### Returns

`ReadonlyMap`\<[`SessionId`](../../../../type-aliases/SessionId.md), [`AnyMaterializedSession`](../type-aliases/AnyMaterializedSession.md)\>

All currently materialized sessions.

#### Implementation of

[`IUserLibraryRuntime`](../interfaces/IUserLibraryRuntime.md).[`materializedSessions`](../interfaces/IUserLibraryRuntime.md#materializedsessions)

## Methods

### createFillingSession()

> **createFillingSession**(`versionId`, `options`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFillingSessionEntity`](../../Entities/interfaces/IFillingSessionEntity.md)\>

Defined in: [ts-chocolate/src/packlets/user-runtime/userLibraryRuntime.ts:123](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/user-runtime/userLibraryRuntime.ts#L123)

Creates a new persisted filling session from a filling version.
The session is created and persisted immediately.

#### Parameters

##### versionId

[`FillingVersionId`](../../../../type-aliases/FillingVersionId.md)

Source filling version to create session for

##### options

[`ICreateFillingSessionOptions`](../interfaces/ICreateFillingSessionOptions.md)

Creation options including target collection

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFillingSessionEntity`](../../Entities/interfaces/IFillingSessionEntity.md)\>

Result with the created persisted session

#### Implementation of

[`IUserLibraryRuntime`](../interfaces/IUserLibraryRuntime.md).[`createFillingSession`](../interfaces/IUserLibraryRuntime.md#createfillingsession)

***

### evictSession()

> **evictSession**(`sessionId`): `boolean`

Defined in: [ts-chocolate/src/packlets/user-runtime/userLibraryRuntime.ts:194](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/user-runtime/userLibraryRuntime.ts#L194)

Evicts a materialized session from the cache.
The persisted session remains in the library.

#### Parameters

##### sessionId

[`SessionId`](../../../../type-aliases/SessionId.md)

Session to evict

#### Returns

`boolean`

True if session was cached and evicted

#### Implementation of

[`IUserLibraryRuntime`](../interfaces/IUserLibraryRuntime.md).[`evictSession`](../interfaces/IUserLibraryRuntime.md#evictsession)

***

### getMaterializedSession()

> **getMaterializedSession**(`sessionId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AnyMaterializedSession`](../type-aliases/AnyMaterializedSession.md)\>

Defined in: [ts-chocolate/src/packlets/user-runtime/userLibraryRuntime.ts:93](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/user-runtime/userLibraryRuntime.ts#L93)

Gets a materialized editing session from a persisted session.
Returns cached session if already materialized, or materializes on demand.

#### Parameters

##### sessionId

[`SessionId`](../../../../type-aliases/SessionId.md)

Full persisted session ID (collectionId.baseId)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AnyMaterializedSession`](../type-aliases/AnyMaterializedSession.md)\>

Result with the materialized editing session (filling or confection)

#### Implementation of

[`IUserLibraryRuntime`](../interfaces/IUserLibraryRuntime.md).[`getMaterializedSession`](../interfaces/IUserLibraryRuntime.md#getmaterializedsession)

***

### saveSession()

> **saveSession**(`sessionId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AnySessionEntity`](../../Entities/type-aliases/AnySessionEntity.md)\>

Defined in: [ts-chocolate/src/packlets/user-runtime/userLibraryRuntime.ts:149](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/user-runtime/userLibraryRuntime.ts#L149)

Saves an active session back to the library.

#### Parameters

##### sessionId

[`SessionId`](../../../../type-aliases/SessionId.md)

Session to save

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AnySessionEntity`](../../Entities/type-aliases/AnySessionEntity.md)\>

Result with the updated persisted session

#### Implementation of

[`IUserLibraryRuntime`](../interfaces/IUserLibraryRuntime.md).[`saveSession`](../interfaces/IUserLibraryRuntime.md#savesession)

***

### create()

> `static` **create**(`userLibrary`, `sessionContext`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`UserLibraryRuntime`\>

Defined in: [ts-chocolate/src/packlets/user-runtime/userLibraryRuntime.ts:72](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/user-runtime/userLibraryRuntime.ts#L72)

Creates a new UserLibraryRuntime.

#### Parameters

##### userLibrary

[`IUserLibrary`](../../UserLibrary/interfaces/IUserLibrary.md)

The user library containing persisted sessions

##### sessionContext

[`ISessionContext`](../../Runtime/interfaces/ISessionContext.md)

The session context for materializing recipes and confections

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`UserLibraryRuntime`\>

Result with the UserLibraryRuntime
