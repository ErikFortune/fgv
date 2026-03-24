[**@fgv/ts-web-extras**](../README.md)

***

[@fgv/ts-web-extras](../README.md) / IFsAccessApis

# Interface: IFsAccessApis

File System Access API methods available on Window

## Methods

### showDirectoryPicker()

> **showDirectoryPicker**(`options?`): `Promise`\<[`FileSystemDirectoryHandle`](FileSystemDirectoryHandle.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`ShowDirectoryPickerOptions`](ShowDirectoryPickerOptions.md) |

#### Returns

`Promise`\<[`FileSystemDirectoryHandle`](FileSystemDirectoryHandle.md)\>

***

### showOpenFilePicker()

> **showOpenFilePicker**(`options?`): `Promise`\<[`FileSystemFileHandle`](FileSystemFileHandle.md)[]\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`ShowOpenFilePickerOptions`](ShowOpenFilePickerOptions.md) |

#### Returns

`Promise`\<[`FileSystemFileHandle`](FileSystemFileHandle.md)[]\>

***

### showSaveFilePicker()

> **showSaveFilePicker**(`options?`): `Promise`\<[`FileSystemFileHandle`](FileSystemFileHandle.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`ShowSaveFilePickerOptions`](ShowSaveFilePickerOptions.md) |

#### Returns

`Promise`\<[`FileSystemFileHandle`](FileSystemFileHandle.md)\>
