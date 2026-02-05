[**@fgv/ts-chocolate**](../README.md)

***

[@fgv/ts-chocolate](../README.md) / IWorkspace

# Interface: IWorkspace

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:67](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/workspace/model.ts#L67)

The primary entry point for chocolate applications.

A workspace provides unified access to:
- Library content (ingredients, fillings, confections, etc.)
- Session creation for editing
- Key store for encrypted collection support

## Properties

### isReady

> `readonly` **isReady**: `boolean`

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:116](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/workspace/model.ts#L116)

Whether the workspace is ready for use (unlocked or no key store configured).

***

### journals

> `readonly` **journals**: [`JournalLibrary`](../@fgv/namespaces/Entities/classes/JournalLibrary.md)

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:79](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/workspace/model.ts#L79)

Journal library for production records (user-specific data).

***

### keyStore

> `readonly` **keyStore**: [`KeyStore_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs) \| `undefined`

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:95](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/workspace/model.ts#L95)

The key store for encryption key management, if configured.

***

### runtime

> `readonly` **runtime**: [`RuntimeContext`](../classes/RuntimeContext.md)

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:74](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/workspace/model.ts#L74)

The runtime context providing library resolution and session capabilities.
Access library data via `runtime.library`, queries via `runtime.ingredients`, etc.

***

### sessions

> `readonly` **sessions**: [`SessionLibrary`](../@fgv/namespaces/Entities/classes/SessionLibrary.md)

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:84](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/workspace/model.ts#L84)

Session library for persisted editing sessions (user-specific data).

***

### settings

> `readonly` **settings**: [`ISettingsManager`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs) \| `undefined`

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:101](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/workspace/model.ts#L101)

The settings manager for workspace configuration.
May be undefined if workspace was created without platform initialization.

***

### state

> `readonly` **state**: [`WorkspaceState`](../type-aliases/WorkspaceState.md)

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:111](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/workspace/model.ts#L111)

Current state of the workspace with respect to key store.
- `'locked'`: Key store is present but not unlocked
- `'unlocked'`: Key store is present and unlocked
- `'no-keystore'`: No key store configured

***

### userRuntime

> `readonly` **userRuntime**: [`IUserLibraryRuntime`](../@fgv/namespaces/UserRuntime/interfaces/IUserLibraryRuntime.md)

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:90](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/workspace/model.ts#L90)

User library runtime for materializing persisted sessions.
Provides session restoration and caching.

## Methods

### lock()

> **lock**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`IWorkspace`\>

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:134](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/workspace/model.ts#L134)

Locks the workspace.
- Locks the key store, clearing secrets from memory

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`IWorkspace`\>

Success with the workspace, or Failure if lock fails

***

### unlock()

> **unlock**(`password`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`IWorkspace`\>\>

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:127](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/workspace/model.ts#L127)

Unlocks the workspace with a password.
- Unlocks the key store
- Loads any protected collections using the now-available secrets

#### Parameters

##### password

`string`

The master password for the key store

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`IWorkspace`\>\>

Success with the workspace, or Failure if unlock fails
