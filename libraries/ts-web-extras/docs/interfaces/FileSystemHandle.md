[**@fgv/ts-web-extras**](../README.md)

***

[@fgv/ts-web-extras](../README.md) / FileSystemHandle

# Interface: FileSystemHandle

Base interface for file system handles

## Extended by

- [`FileSystemFileHandle`](FileSystemFileHandle.md)
- [`FileSystemDirectoryHandle`](FileSystemDirectoryHandle.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="kind"></a> `kind` | `readonly` | `"file"` \| `"directory"` |
| <a id="name"></a> `name` | `readonly` | `string` |

## Methods

### isSameEntry()

> **isSameEntry**(`other`): `Promise`\<`boolean`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `other` | `FileSystemHandle` |

#### Returns

`Promise`\<`boolean`\>

***

### queryPermission()

> **queryPermission**(`descriptor?`): `Promise`\<`PermissionState`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `descriptor?` | [`FileSystemHandlePermissionDescriptor`](FileSystemHandlePermissionDescriptor.md) |

#### Returns

`Promise`\<`PermissionState`\>

***

### requestPermission()

> **requestPermission**(`descriptor?`): `Promise`\<`PermissionState`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `descriptor?` | [`FileSystemHandlePermissionDescriptor`](FileSystemHandlePermissionDescriptor.md) |

#### Returns

`Promise`\<`PermissionState`\>
