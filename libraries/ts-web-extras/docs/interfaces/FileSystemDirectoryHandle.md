[**@fgv/ts-web-extras**](../README.md)

***

[@fgv/ts-web-extras](../README.md) / FileSystemDirectoryHandle

# Interface: FileSystemDirectoryHandle

Directory handle interface

## Extends

- [`FileSystemHandle`](FileSystemHandle.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="kind"></a> `kind` | `readonly` | `"directory"` |
| <a id="name"></a> `name` | `readonly` | `string` |

## Methods

### \[asyncIterator\]()

> **\[asyncIterator\]**(): `AsyncIterableIterator`\<\[`string`, [`FileSystemHandle`](FileSystemHandle.md)\]\>

#### Returns

`AsyncIterableIterator`\<\[`string`, [`FileSystemHandle`](FileSystemHandle.md)\]\>

***

### entries()

> **entries**(): `AsyncIterableIterator`\<\[`string`, [`FileSystemHandle`](FileSystemHandle.md)\]\>

#### Returns

`AsyncIterableIterator`\<\[`string`, [`FileSystemHandle`](FileSystemHandle.md)\]\>

***

### getDirectoryHandle()

> **getDirectoryHandle**(`name`, `options?`): `Promise`\<`FileSystemDirectoryHandle`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `options?` | [`FileSystemGetDirectoryOptions`](FileSystemGetDirectoryOptions.md) |

#### Returns

`Promise`\<`FileSystemDirectoryHandle`\>

***

### getFileHandle()

> **getFileHandle**(`name`, `options?`): `Promise`\<[`FileSystemFileHandle`](FileSystemFileHandle.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `options?` | [`FileSystemGetFileOptions`](FileSystemGetFileOptions.md) |

#### Returns

`Promise`\<[`FileSystemFileHandle`](FileSystemFileHandle.md)\>

***

### isSameEntry()

> **isSameEntry**(`other`): `Promise`\<`boolean`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `other` | [`FileSystemHandle`](FileSystemHandle.md) |

#### Returns

`Promise`\<`boolean`\>

#### Inherited from

[`FileSystemHandle`](FileSystemHandle.md).[`isSameEntry`](FileSystemHandle.md#issameentry)

***

### keys()

> **keys**(): `AsyncIterableIterator`\<`string`\>

#### Returns

`AsyncIterableIterator`\<`string`\>

***

### queryPermission()

> **queryPermission**(`descriptor?`): `Promise`\<`PermissionState`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `descriptor?` | [`FileSystemHandlePermissionDescriptor`](FileSystemHandlePermissionDescriptor.md) |

#### Returns

`Promise`\<`PermissionState`\>

#### Inherited from

[`FileSystemHandle`](FileSystemHandle.md).[`queryPermission`](FileSystemHandle.md#querypermission)

***

### removeEntry()

> **removeEntry**(`name`, `options?`): `Promise`\<`void`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `options?` | [`FileSystemRemoveOptions`](FileSystemRemoveOptions.md) |

#### Returns

`Promise`\<`void`\>

***

### requestPermission()

> **requestPermission**(`descriptor?`): `Promise`\<`PermissionState`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `descriptor?` | [`FileSystemHandlePermissionDescriptor`](FileSystemHandlePermissionDescriptor.md) |

#### Returns

`Promise`\<`PermissionState`\>

#### Inherited from

[`FileSystemHandle`](FileSystemHandle.md).[`requestPermission`](FileSystemHandle.md#requestpermission)

***

### resolve()

> **resolve**(`possibleDescendant`): `Promise`\<`string`[] \| `null`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `possibleDescendant` | [`FileSystemHandle`](FileSystemHandle.md) |

#### Returns

`Promise`\<`string`[] \| `null`\>

***

### values()

> **values**(): `AsyncIterableIterator`\<[`FileSystemHandle`](FileSystemHandle.md)\>

#### Returns

`AsyncIterableIterator`\<[`FileSystemHandle`](FileSystemHandle.md)\>
