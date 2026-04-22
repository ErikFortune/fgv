[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-http-storage](../README.md) / FsStorageProvider

# Class: FsStorageProvider

Filesystem-backed implementation of [IHttpStorageProvider](../interfaces/IHttpStorageProvider.md).

## Implements

- [`IHttpStorageProvider`](../interfaces/IHttpStorageProvider.md)

## Constructors

### Constructor

> **new FsStorageProvider**(`rootPath`): `FsStorageProvider`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `rootPath` | `string` |

#### Returns

`FsStorageProvider`

## Methods

### createDirectory()

> **createDirectory**(`itemPath`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageTreeItem`](../interfaces/IStorageTreeItem.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `itemPath` | `string` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageTreeItem`](../interfaces/IStorageTreeItem.md)\>\>

#### Implementation of

[`IHttpStorageProvider`](../interfaces/IHttpStorageProvider.md).[`createDirectory`](../interfaces/IHttpStorageProvider.md#createdirectory)

***

### deleteFile()

> **deleteFile**(`itemPath`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `itemPath` | `string` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

#### Implementation of

[`IHttpStorageProvider`](../interfaces/IHttpStorageProvider.md).[`deleteFile`](../interfaces/IHttpStorageProvider.md#deletefile)

***

### getChildren()

> **getChildren**(`itemPath`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IStorageTreeItem`](../interfaces/IStorageTreeItem.md)[]\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `itemPath` | `string` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IStorageTreeItem`](../interfaces/IStorageTreeItem.md)[]\>\>

#### Implementation of

[`IHttpStorageProvider`](../interfaces/IHttpStorageProvider.md).[`getChildren`](../interfaces/IHttpStorageProvider.md#getchildren)

***

### getFile()

> **getFile**(`itemPath`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageFileResponse`](../interfaces/IStorageFileResponse.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `itemPath` | `string` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageFileResponse`](../interfaces/IStorageFileResponse.md)\>\>

#### Implementation of

[`IHttpStorageProvider`](../interfaces/IHttpStorageProvider.md).[`getFile`](../interfaces/IHttpStorageProvider.md#getfile)

***

### getItem()

> **getItem**(`itemPath`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageTreeItem`](../interfaces/IStorageTreeItem.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `itemPath` | `string` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageTreeItem`](../interfaces/IStorageTreeItem.md)\>\>

#### Implementation of

[`IHttpStorageProvider`](../interfaces/IHttpStorageProvider.md).[`getItem`](../interfaces/IHttpStorageProvider.md#getitem)

***

### saveFile()

> **saveFile**(`itemPath`, `contents`, `contentType?`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageFileResponse`](../interfaces/IStorageFileResponse.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `itemPath` | `string` |
| `contents` | `string` |
| `contentType?` | `string` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageFileResponse`](../interfaces/IStorageFileResponse.md)\>\>

#### Implementation of

[`IHttpStorageProvider`](../interfaces/IHttpStorageProvider.md).[`saveFile`](../interfaces/IHttpStorageProvider.md#savefile)

***

### sync()

> **sync**(): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageSyncResponse`](../interfaces/IStorageSyncResponse.md)\>\>

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageSyncResponse`](../interfaces/IStorageSyncResponse.md)\>\>

#### Implementation of

[`IHttpStorageProvider`](../interfaces/IHttpStorageProvider.md).[`sync`](../interfaces/IHttpStorageProvider.md#sync)
