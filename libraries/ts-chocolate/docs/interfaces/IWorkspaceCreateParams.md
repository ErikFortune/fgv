[**@fgv/ts-chocolate**](../README.md)

***

[@fgv/ts-chocolate](../README.md) / IWorkspaceCreateParams

# Interface: IWorkspaceCreateParams

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:165](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/workspace/model.ts#L165)

Parameters for creating a workspace.

Combines library loading parameters with key store configuration.

## Properties

### builtin?

> `readonly` `optional` **builtin**: [`FullLibraryLoadSpec`](../@fgv/namespaces/LibraryData/type-aliases/FullLibraryLoadSpec.md)

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:172](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/workspace/model.ts#L172)

Specifies built-in data loading for each sub-library.

#### See

[LibraryData.FullLibraryLoadSpec](../@fgv/namespaces/LibraryData/type-aliases/FullLibraryLoadSpec.md)

***

### encryption?

> `readonly` `optional` **encryption**: `Partial`\<`Omit`\<[`IEncryptionConfig`](../@fgv/namespaces/LibraryData/interfaces/IEncryptionConfig.md), `"secretProvider"`\>\>

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:213](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/workspace/model.ts#L213)

Additional encryption configuration options.
The workspace automatically wires up the key store's secret provider.

***

### fileSources?

> `readonly` `optional` **fileSources**: [`ILibraryFileTreeSource`](../@fgv/namespaces/LibraryData/interfaces/ILibraryFileTreeSource.md) \| readonly [`ILibraryFileTreeSource`](../@fgv/namespaces/LibraryData/interfaces/ILibraryFileTreeSource.md)[]

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:178](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/workspace/model.ts#L178)

File tree sources to load data from.

#### See

[LibraryData.ILibraryFileTreeSource](../@fgv/namespaces/LibraryData/interfaces/ILibraryFileTreeSource.md)

***

### journals?

> `readonly` `optional` **journals**: [`JournalLibrary`](../@fgv/namespaces/Entities/classes/JournalLibrary.md)

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:197](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/workspace/model.ts#L197)

Pre-instantiated journal library.

***

### keyStore?

> `readonly` `optional` **keyStore**: [`IWorkspaceKeyStoreConfig`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:205](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/workspace/model.ts#L205)

Key store configuration.
If provided, the workspace will support encrypted collections.

***

### libraries?

> `readonly` `optional` **libraries**: [`IInstantiatedLibrarySource`](../@fgv/namespaces/LibraryRuntime/interfaces/IInstantiatedLibrarySource.md)

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:184](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/workspace/model.ts#L184)

Pre-instantiated library sources.

#### See

[LibraryRuntime.IInstantiatedLibrarySource](../@fgv/namespaces/LibraryRuntime/interfaces/IInstantiatedLibrarySource.md)

***

### logger?

> `readonly` `optional` **logger**: [`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`, `unknown`\>

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:220](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/workspace/model.ts#L220)

Logger for workspace operations.

***

### preWarm?

> `readonly` `optional` **preWarm**: `boolean`

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:228](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/workspace/model.ts#L228)

Whether to pre-warm the runtime caches on creation.

#### Default Value

```ts
false
```

***

### userFileSources?

> `readonly` `optional` **userFileSources**: [`ILibraryFileTreeSource`](../@fgv/namespaces/LibraryData/interfaces/ILibraryFileTreeSource.md) \| readonly [`ILibraryFileTreeSource`](../@fgv/namespaces/LibraryData/interfaces/ILibraryFileTreeSource.md)[]

Defined in: [ts-chocolate/src/packlets/workspace/model.ts:192](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/workspace/model.ts#L192)

File tree sources for user-specific data (journals, future inventory).
Separate from shared library sources.
