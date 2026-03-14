[**@fgv/ts-web-extras**](../README.md)

***

[@fgv/ts-web-extras](../README.md) / FileSystemFileHandle

# Interface: FileSystemFileHandle

File handle interface

## Extends

- [`FileSystemHandle`](FileSystemHandle.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="kind"></a> `kind` | `readonly` | `"file"` |
| <a id="name"></a> `name` | `readonly` | `string` |

## Methods

### createWritable()

> **createWritable**(`options?`): `Promise`\<[`FileSystemWritableFileStream`](FileSystemWritableFileStream.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`FileSystemCreateWritableOptions`](FileSystemCreateWritableOptions.md) |

#### Returns

`Promise`\<[`FileSystemWritableFileStream`](FileSystemWritableFileStream.md)\>

***

### getFile()

> **getFile**(): `Promise`\<`File`\>

#### Returns

`Promise`\<`File`\>

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
