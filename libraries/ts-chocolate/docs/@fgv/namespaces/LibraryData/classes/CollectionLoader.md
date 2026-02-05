[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / CollectionLoader

# Class: CollectionLoader\<T, TCOLLECTIONID, TITEMID\>

Defined in: [ts-chocolate/src/packlets/library-data/collectionLoader.ts:128](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionLoader.ts#L128)

Loads collections from a file tree, validating with supplied converters and filtering as specified.

## Type Parameters

### T

`T` = [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

### TCOLLECTIONID

`TCOLLECTIONID` *extends* `string` = `string`

### TITEMID

`TITEMID` *extends* `string` = `string`

## Constructors

### Constructor

> **new CollectionLoader**\<`T`, `TCOLLECTIONID`, `TITEMID`\>(`params`): `CollectionLoader`\<`T`, `TCOLLECTIONID`, `TITEMID`\>

Defined in: [ts-chocolate/src/packlets/library-data/collectionLoader.ts:142](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionLoader.ts#L142)

#### Parameters

##### params

[`ICollectionLoaderInitParams`](../interfaces/ICollectionLoaderInitParams.md)\<`T`, `TCOLLECTIONID`, `TITEMID`\>

#### Returns

`CollectionLoader`\<`T`, `TCOLLECTIONID`, `TITEMID`\>

## Methods

### loadFromFileTree()

> **loadFromFileTree**(`fileTree`, `params?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionLoadResult`](../interfaces/ICollectionLoadResult.md)\<`T`, `TCOLLECTIONID`, `TITEMID`\>\>

Defined in: [ts-chocolate/src/packlets/library-data/collectionLoader.ts:177](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionLoader.ts#L177)

Loads collections from a `FileTree` using optional filtering parameters.

Encrypted collections are handled according to `onEncryptedFile`:
- `'fail'`: Fail the entire load operation
- `'skip'`: Silently skip encrypted files
- `'warn'`: Log warning and skip
- `'capture'`: Capture encrypted files for later decryption (default)

Use [loadFromFileTreeAsync](#loadfromfiletreeasync)
to decrypt encrypted files during loading.

#### Parameters

##### fileTree

[`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

The `FileTree` from which to load collections.

##### params?

[`ILoadCollectionFromFileTreeParams`](../interfaces/ILoadCollectionFromFileTreeParams.md)\<`TCOLLECTIONID`\>

optional [parameters](../interfaces/ILoadCollectionFromFileTreeParams.md) to control filtering
and recursion.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionLoadResult`](../interfaces/ICollectionLoadResult.md)\<`T`, `TCOLLECTIONID`, `TITEMID`\>\>

Success with load result containing collections and captured protected collections, or Failure with error.

***

### loadFromFileTreeAsync()

> **loadFromFileTreeAsync**(`fileTree`, `params?`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionLoadResult`](../interfaces/ICollectionLoadResult.md)\<`T`, `TCOLLECTIONID`, `TITEMID`\>\>\>

Defined in: [ts-chocolate/src/packlets/library-data/collectionLoader.ts:292](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-data/collectionLoader.ts#L292)

Loads collections from a `FileTree` asynchronously, supporting encrypted files.

When encryption config is provided, attempts to decrypt encrypted files.
Files that cannot be decrypted (missing key with skip/warn/capture mode) are
captured in the result's `protectedCollections` for later decryption.

#### Parameters

##### fileTree

[`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

The `FileTree` from which to load collections.

##### params?

[`ILoadCollectionFromFileTreeParams`](../interfaces/ILoadCollectionFromFileTreeParams.md)\<`TCOLLECTIONID`\>

optional [parameters](../interfaces/ILoadCollectionFromFileTreeParams.md) to control filtering
and recursion.

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionLoadResult`](../interfaces/ICollectionLoadResult.md)\<`T`, `TCOLLECTIONID`, `TITEMID`\>\>\>

Promise resolving to Success with load result, or Failure with error.
