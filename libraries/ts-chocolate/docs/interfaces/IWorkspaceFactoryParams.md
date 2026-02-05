[**@fgv/ts-chocolate**](../README.md)

***

[@fgv/ts-chocolate](../README.md) / IWorkspaceFactoryParams

# Interface: IWorkspaceFactoryParams

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:236](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/workspace/model.ts#L236)

Parameters for creating a workspace with platform-specific defaults.
Used by platform factory functions.

## Extends

- `Omit`\<[`IWorkspaceCreateParams`](IWorkspaceCreateParams.md), `"keyStore"`\>

## Properties

### builtin?

> `readonly` `optional` **builtin**: [`FullLibraryLoadSpec`](../@fgv/namespaces/LibraryData/type-aliases/FullLibraryLoadSpec.md)

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:172](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/workspace/model.ts#L172)

Specifies built-in data loading for each sub-library.

#### See

[LibraryData.FullLibraryLoadSpec](../@fgv/namespaces/LibraryData/type-aliases/FullLibraryLoadSpec.md)

#### Inherited from

[`IWorkspaceCreateParams`](IWorkspaceCreateParams.md).[`builtin`](IWorkspaceCreateParams.md#builtin)

***

### encryption?

> `readonly` `optional` **encryption**: `Partial`\<`Omit`\<[`IEncryptionConfig`](../@fgv/namespaces/LibraryData/interfaces/IEncryptionConfig.md), `"secretProvider"`\>\>

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:213](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/workspace/model.ts#L213)

Additional encryption configuration options.
The workspace automatically wires up the key store's secret provider.

#### Inherited from

[`IWorkspaceCreateParams`](IWorkspaceCreateParams.md).[`encryption`](IWorkspaceCreateParams.md#encryption)

***

### fileSources?

> `readonly` `optional` **fileSources**: [`ILibraryFileTreeSource`](../@fgv/namespaces/LibraryData/interfaces/ILibraryFileTreeSource.md) \| readonly [`ILibraryFileTreeSource`](../@fgv/namespaces/LibraryData/interfaces/ILibraryFileTreeSource.md)[]

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:178](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/workspace/model.ts#L178)

File tree sources to load data from.

#### See

[LibraryData.ILibraryFileTreeSource](../@fgv/namespaces/LibraryData/interfaces/ILibraryFileTreeSource.md)

#### Inherited from

[`IWorkspaceCreateParams`](IWorkspaceCreateParams.md).[`fileSources`](IWorkspaceCreateParams.md#filesources)

***

### journals?

> `readonly` `optional` **journals**: [`JournalLibrary`](../@fgv/namespaces/Entities/classes/JournalLibrary.md)

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:197](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/workspace/model.ts#L197)

Pre-instantiated journal library.

#### Inherited from

[`IWorkspaceCreateParams`](IWorkspaceCreateParams.md).[`journals`](IWorkspaceCreateParams.md#journals)

***

### keyStoreFile?

> `readonly` `optional` **keyStoreFile**: [`IKeyStoreFile`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:241](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/workspace/model.ts#L241)

Key store file data to load.
The crypto provider will be supplied by the platform factory.

***

### libraries?

> `readonly` `optional` **libraries**: [`IInstantiatedLibrarySource`](../@fgv/namespaces/LibraryRuntime/interfaces/IInstantiatedLibrarySource.md)

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:184](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/workspace/model.ts#L184)

Pre-instantiated library sources.

#### See

[LibraryRuntime.IInstantiatedLibrarySource](../@fgv/namespaces/LibraryRuntime/interfaces/IInstantiatedLibrarySource.md)

#### Inherited from

[`IWorkspaceCreateParams`](IWorkspaceCreateParams.md).[`libraries`](IWorkspaceCreateParams.md#libraries)

***

### logger?

> `readonly` `optional` **logger**: [`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`, `unknown`\>

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:220](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/workspace/model.ts#L220)

Logger for workspace operations.

#### Inherited from

[`IWorkspaceCreateParams`](IWorkspaceCreateParams.md).[`logger`](IWorkspaceCreateParams.md#logger)

***

### preWarm?

> `readonly` `optional` **preWarm**: `boolean`

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:228](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/workspace/model.ts#L228)

Whether to pre-warm the runtime caches on creation.

#### Default Value

```ts
false
```

#### Inherited from

[`IWorkspaceCreateParams`](IWorkspaceCreateParams.md).[`preWarm`](IWorkspaceCreateParams.md#prewarm)

***

### userFileSources?

> `readonly` `optional` **userFileSources**: [`ILibraryFileTreeSource`](../@fgv/namespaces/LibraryData/interfaces/ILibraryFileTreeSource.md) \| readonly [`ILibraryFileTreeSource`](../@fgv/namespaces/LibraryData/interfaces/ILibraryFileTreeSource.md)[]

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:192](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/workspace/model.ts#L192)

File tree sources for user-specific data (journals, future inventory).
Separate from shared library sources.

#### Inherited from

[`IWorkspaceCreateParams`](IWorkspaceCreateParams.md).[`userFileSources`](IWorkspaceCreateParams.md#userfilesources)
