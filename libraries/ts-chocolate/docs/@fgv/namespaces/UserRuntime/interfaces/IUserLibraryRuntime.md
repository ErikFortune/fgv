[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [UserRuntime](../README.md) / IUserLibraryRuntime

# Interface: IUserLibraryRuntime

Defined in: [ts-chocolate/src/packlets/user-runtime/model.ts:61](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/user-runtime/model.ts#L61)

Runtime materialization layer for user library data.

This interface provides:
- Materialization of persisted sessions into runtime editing sessions
- Caching of materialized sessions for efficient access
- Creation and persistence of new sessions

## Properties

### materializedSessions

> `readonly` **materializedSessions**: `ReadonlyMap`\<[`SessionId`](../../../../type-aliases/SessionId.md), [`AnyMaterializedSession`](../type-aliases/AnyMaterializedSession.md)\>

Defined in: [ts-chocolate/src/packlets/user-runtime/model.ts:100](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/user-runtime/model.ts#L100)

All currently materialized sessions.

## Methods

### createFillingSession()

> **createFillingSession**(`versionId`, `options`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFillingSessionEntity`](../../Entities/interfaces/IFillingSessionEntity.md)\>

Defined in: [ts-chocolate/src/packlets/user-runtime/model.ts:77](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/user-runtime/model.ts#L77)

Creates a new persisted filling session from a filling version.
The session is created and persisted immediately.

#### Parameters

##### versionId

[`FillingVersionId`](../../../../type-aliases/FillingVersionId.md)

Source filling version to create session for

##### options

[`ICreateFillingSessionOptions`](ICreateFillingSessionOptions.md)

Creation options including target collection

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFillingSessionEntity`](../../Entities/interfaces/IFillingSessionEntity.md)\>

Result with the created persisted session

***

### evictSession()

> **evictSession**(`sessionId`): `boolean`

Defined in: [ts-chocolate/src/packlets/user-runtime/model.ts:95](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/user-runtime/model.ts#L95)

Evicts a materialized session from the cache.
The persisted session remains in the library.

#### Parameters

##### sessionId

[`SessionId`](../../../../type-aliases/SessionId.md)

Session to evict

#### Returns

`boolean`

True if session was cached and evicted

***

### getMaterializedSession()

> **getMaterializedSession**(`sessionId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AnyMaterializedSession`](../type-aliases/AnyMaterializedSession.md)\>

Defined in: [ts-chocolate/src/packlets/user-runtime/model.ts:68](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/user-runtime/model.ts#L68)

Gets a materialized editing session from a persisted session.
Returns cached session if already materialized, or materializes on demand.

#### Parameters

##### sessionId

[`SessionId`](../../../../type-aliases/SessionId.md)

Full persisted session ID (collectionId.baseId)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AnyMaterializedSession`](../type-aliases/AnyMaterializedSession.md)\>

Result with the materialized editing session (filling or confection)

***

### saveSession()

> **saveSession**(`sessionId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AnySessionEntity`](../../Entities/type-aliases/AnySessionEntity.md)\>

Defined in: [ts-chocolate/src/packlets/user-runtime/model.ts:87](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/user-runtime/model.ts#L87)

Saves an active session back to the library.

#### Parameters

##### sessionId

[`SessionId`](../../../../type-aliases/SessionId.md)

Session to save

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`AnySessionEntity`](../../Entities/type-aliases/AnySessionEntity.md)\>

Result with the updated persisted session
