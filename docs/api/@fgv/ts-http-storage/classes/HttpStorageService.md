[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-http-storage](../README.md) / HttpStorageService

# Class: HttpStorageService

Service layer for storage API operations.

## Constructors

### Constructor

> **new HttpStorageService**(`providers`): `HttpStorageService`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `providers` | [`IHttpStorageProviderFactory`](../interfaces/IHttpStorageProviderFactory.md) |

#### Returns

`HttpStorageService`

## Methods

### createDirectory()

> **createDirectory**(`request`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageTreeItem`](../interfaces/IStorageTreeItem.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IStoragePathRequest`](../interfaces/IStoragePathRequest.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageTreeItem`](../interfaces/IStorageTreeItem.md)\>\>

***

### deleteFile()

> **deleteFile**(`request`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IStoragePathRequest`](../interfaces/IStoragePathRequest.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

***

### getChildren()

> **getChildren**(`request`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageTreeChildrenResponse`](../interfaces/IStorageTreeChildrenResponse.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IStoragePathRequest`](../interfaces/IStoragePathRequest.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageTreeChildrenResponse`](../interfaces/IStorageTreeChildrenResponse.md)\>\>

***

### getFile()

> **getFile**(`request`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageFileResponse`](../interfaces/IStorageFileResponse.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IStoragePathRequest`](../interfaces/IStoragePathRequest.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageFileResponse`](../interfaces/IStorageFileResponse.md)\>\>

***

### getItem()

> **getItem**(`request`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageTreeItem`](../interfaces/IStorageTreeItem.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IStoragePathRequest`](../interfaces/IStoragePathRequest.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageTreeItem`](../interfaces/IStorageTreeItem.md)\>\>

***

### saveFile()

> **saveFile**(`request`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageFileResponse`](../interfaces/IStorageFileResponse.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IStorageWriteFileRequest`](../interfaces/IStorageWriteFileRequest.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageFileResponse`](../interfaces/IStorageFileResponse.md)\>\>

***

### sync()

> **sync**(`request`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageSyncResponse`](../interfaces/IStorageSyncResponse.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IStorageSyncRequest`](../interfaces/IStorageSyncRequest.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageSyncResponse`](../interfaces/IStorageSyncResponse.md)\>\>
