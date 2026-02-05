[**@fgv/ts-chocolate**](../README.md)

***

[@fgv/ts-chocolate](../README.md) / Workspace

# Class: Workspace

Defined in: [ts-chocolate/src/packlets/workspace/workspace.ts:57](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/workspace/workspace.ts#L57)

The primary entry point for chocolate applications.

Workspace is a thin coordinator that wraps:
- RuntimeContext for library access and session creation
- KeyStore for encrypted collection support

## Implements

- [`IWorkspace`](../interfaces/IWorkspace.md)

## Accessors

### isReady

#### Get Signature

> **get** **isReady**(): `boolean`

Defined in: [ts-chocolate/src/packlets/workspace/workspace.ts:315](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/workspace/workspace.ts#L315)

Whether the workspace is ready for use (unlocked or no key store configured).

##### Returns

`boolean`

Whether the workspace is ready for use (unlocked or no key store configured).

#### Implementation of

[`IWorkspace`](../interfaces/IWorkspace.md).[`isReady`](../interfaces/IWorkspace.md#isready)

***

### journals

#### Get Signature

> **get** **journals**(): [`JournalLibrary`](../@fgv/namespaces/Entities/classes/JournalLibrary.md)

Defined in: [ts-chocolate/src/packlets/workspace/workspace.ts:262](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/workspace/workspace.ts#L262)

Journal library for production records (user-specific data).

##### Returns

[`JournalLibrary`](../@fgv/namespaces/Entities/classes/JournalLibrary.md)

Journal library for production records (user-specific data).

#### Implementation of

[`IWorkspace`](../interfaces/IWorkspace.md).[`journals`](../interfaces/IWorkspace.md#journals)

***

### keyStore

#### Get Signature

> **get** **keyStore**(): [`KeyStore_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs) \| `undefined`

Defined in: [ts-chocolate/src/packlets/workspace/workspace.ts:287](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/workspace/workspace.ts#L287)

The key store for encryption key management, if configured.

##### Returns

[`KeyStore_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs) \| `undefined`

The key store for encryption key management, if configured.

#### Implementation of

[`IWorkspace`](../interfaces/IWorkspace.md).[`keyStore`](../interfaces/IWorkspace.md#keystore)

***

### runtime

#### Get Signature

> **get** **runtime**(): [`RuntimeContext`](RuntimeContext.md)

Defined in: [ts-chocolate/src/packlets/workspace/workspace.ts:255](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/workspace/workspace.ts#L255)

The runtime context providing library resolution and session capabilities.
Access library data via `runtime.library`, queries via `runtime.ingredients`, etc.

##### Returns

[`RuntimeContext`](RuntimeContext.md)

The runtime context providing library resolution and session capabilities.
Access library data via `runtime.library`, queries via `runtime.ingredients`, etc.

#### Implementation of

[`IWorkspace`](../interfaces/IWorkspace.md).[`runtime`](../interfaces/IWorkspace.md#runtime)

***

### sessions

#### Get Signature

> **get** **sessions**(): [`SessionLibrary`](../@fgv/namespaces/Entities/classes/SessionLibrary.md)

Defined in: [ts-chocolate/src/packlets/workspace/workspace.ts:269](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/workspace/workspace.ts#L269)

Session library for persisted editing sessions (user-specific data).

##### Returns

[`SessionLibrary`](../@fgv/namespaces/Entities/classes/SessionLibrary.md)

Session library for persisted editing sessions (user-specific data).

#### Implementation of

[`IWorkspace`](../interfaces/IWorkspace.md).[`sessions`](../interfaces/IWorkspace.md#sessions)

***

### settings

#### Get Signature

> **get** **settings**(): [`ISettingsManager`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs) \| `undefined`

Defined in: [ts-chocolate/src/packlets/workspace/workspace.ts:294](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/workspace/workspace.ts#L294)

The settings manager for workspace configuration.
May be undefined if workspace was created without platform initialization.

##### Returns

[`ISettingsManager`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs) \| `undefined`

The settings manager for workspace configuration.
May be undefined if workspace was created without platform initialization.

#### Implementation of

[`IWorkspace`](../interfaces/IWorkspace.md).[`settings`](../interfaces/IWorkspace.md#settings)

***

### state

#### Get Signature

> **get** **state**(): [`WorkspaceState`](../type-aliases/WorkspaceState.md)

Defined in: [ts-chocolate/src/packlets/workspace/workspace.ts:305](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/workspace/workspace.ts#L305)

Current state of the workspace with respect to key store.
- `'locked'`: Key store is present but not unlocked
- `'unlocked'`: Key store is present and unlocked
- `'no-keystore'`: No key store configured

##### Returns

[`WorkspaceState`](../type-aliases/WorkspaceState.md)

Current state of the workspace with respect to key store.
- `'locked'`: Key store is present but not unlocked
- `'unlocked'`: Key store is present and unlocked
- `'no-keystore'`: No key store configured

#### Implementation of

[`IWorkspace`](../interfaces/IWorkspace.md).[`state`](../interfaces/IWorkspace.md#state)

***

### userRuntime

#### Get Signature

> **get** **userRuntime**(): [`IUserLibraryRuntime`](../@fgv/namespaces/UserRuntime/interfaces/IUserLibraryRuntime.md)

Defined in: [ts-chocolate/src/packlets/workspace/workspace.ts:276](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/workspace/workspace.ts#L276)

User library runtime for materializing persisted sessions.
Provides session restoration and caching.

##### Returns

[`IUserLibraryRuntime`](../@fgv/namespaces/UserRuntime/interfaces/IUserLibraryRuntime.md)

User library runtime for materializing persisted sessions.
Provides session restoration and caching.

#### Implementation of

[`IWorkspace`](../interfaces/IWorkspace.md).[`userRuntime`](../interfaces/IWorkspace.md#userruntime)

## Methods

### lock()

> **lock**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IWorkspace`](../interfaces/IWorkspace.md)\>

Defined in: [ts-chocolate/src/packlets/workspace/workspace.ts:351](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/workspace/workspace.ts#L351)

Locks the workspace.
- Locks the key store, clearing secrets from memory

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IWorkspace`](../interfaces/IWorkspace.md)\>

Success with the workspace, or Failure if lock fails

#### Implementation of

[`IWorkspace`](../interfaces/IWorkspace.md).[`lock`](../interfaces/IWorkspace.md#lock)

***

### unlock()

> **unlock**(`password`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IWorkspace`](../interfaces/IWorkspace.md)\>\>

Defined in: [ts-chocolate/src/packlets/workspace/workspace.ts:326](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/workspace/workspace.ts#L326)

Unlocks the workspace with a password.
- Unlocks the key store
- Loads any protected collections using the now-available secrets

#### Parameters

##### password

`string`

The master password for the key store

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IWorkspace`](../interfaces/IWorkspace.md)\>\>

Success with the workspace, or Failure if unlock fails

#### Implementation of

[`IWorkspace`](../interfaces/IWorkspace.md).[`unlock`](../interfaces/IWorkspace.md#unlock)

***

### create()

> `static` **create**(`params?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Workspace`\>

Defined in: [ts-chocolate/src/packlets/workspace/workspace.ts:96](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/workspace/workspace.ts#L96)

Creates a new workspace with the specified configuration.

#### Parameters

##### params?

[`IWorkspaceCreateParams`](../interfaces/IWorkspaceCreateParams.md)

Workspace creation parameters

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Workspace`\>

Success with workspace, or Failure if creation fails

***

### createWithSettings()

> `static` **createWithSettings**(`params`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Workspace`\>

Defined in: [ts-chocolate/src/packlets/workspace/workspace.ts:176](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/workspace/workspace.ts#L176)

Creates a new workspace with a pre-created settings manager.
Used by platform initialization flow after settings have been loaded.

#### Parameters

##### params

[`IWorkspaceCreateWithSettingsParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

Workspace creation parameters with settings manager

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Workspace`\>

Success with workspace, or Failure if creation fails
