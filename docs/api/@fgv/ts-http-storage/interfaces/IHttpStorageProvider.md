[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-http-storage](../README.md) / IHttpStorageProvider

# Interface: IHttpStorageProvider

Provider contract for storage backends.
All methods are async to support both filesystem and database backends.

## Methods

### createDirectory()

> **createDirectory**(`path`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageTreeItem`](IStorageTreeItem.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageTreeItem`](IStorageTreeItem.md)\>\>

***

### deleteFile()

> **deleteFile**(`path`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

***

### getChildren()

> **getChildren**(`path`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IStorageTreeItem`](IStorageTreeItem.md)[]\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IStorageTreeItem`](IStorageTreeItem.md)[]\>\>

***

### getFile()

> **getFile**(`path`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageFileResponse`](IStorageFileResponse.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageFileResponse`](IStorageFileResponse.md)\>\>

***

### getItem()

> **getItem**(`path`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageTreeItem`](IStorageTreeItem.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageTreeItem`](IStorageTreeItem.md)\>\>

***

### saveFile()

> **saveFile**(`path`, `contents`, `contentType?`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageFileResponse`](IStorageFileResponse.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |
| `contents` | `string` |
| `contentType?` | `string` |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageFileResponse`](IStorageFileResponse.md)\>\>

***

### sync()

> **sync**(): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageSyncResponse`](IStorageSyncResponse.md)\>\>

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStorageSyncResponse`](IStorageSyncResponse.md)\>\>
