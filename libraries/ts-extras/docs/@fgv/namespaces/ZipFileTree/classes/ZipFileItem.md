[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [ZipFileTree](../README.md) / ZipFileItem

# Class: ZipFileItem\<TCT\>

Implementation of `FileTree.IFileTreeFileItem` for files in a ZIP archive.
ZIP files are read-only, so this item does not support mutation.
Use [isMutableFileItem](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) to check before attempting mutations.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

## Implements

- [`IFileTreeFileItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>

## Constructors

### Constructor

> **new ZipFileItem**\<`TCT`\>(`zipFilePath`, `contents`, `accessors`): `ZipFileItem`\<`TCT`\>

Constructor for ZipFileItem.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `zipFilePath` | `string` | The path of the file within the ZIP. |
| `contents` | `string` | The pre-loaded contents of the file. |
| `accessors` | [`ZipFileTreeAccessors`](ZipFileTreeAccessors.md)\<`TCT`\> | The ZIP file tree accessors. |

#### Returns

`ZipFileItem`\<`TCT`\>

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="absolutepath"></a> `absolutePath` | `readonly` | `string` | `undefined` | The absolute path of the file within the ZIP archive. |
| <a id="basename"></a> `baseName` | `readonly` | `string` | `undefined` | The base name of the file (without extension) |
| <a id="extension"></a> `extension` | `readonly` | `string` | `undefined` | The extension of the file |
| <a id="name"></a> `name` | `readonly` | `string` | `undefined` | The name of the file |
| <a id="type"></a> `type` | `readonly` | `"file"` | `'file'` | Indicates that this `FileTree.FileTreeItem` is a file. |

## Accessors

### contentType

#### Get Signature

> **get** **contentType**(): `TCT` \| `undefined`

The content type of the file.

##### Returns

`TCT` \| `undefined`

#### Implementation of

`FileTree.IFileTreeFileItem.contentType`

## Methods

### getContents()

#### Call Signature

> **getContents**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

Gets the contents of the file as parsed JSON.

##### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>

##### Implementation of

`FileTree.IFileTreeFileItem.getContents`

#### Call Signature

> **getContents**\<`T`\>(`converter`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Gets the contents of the file as parsed JSON, converted to a specific type.

##### Type Parameters

| Type Parameter |
| ------ |
| `T` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `converter` | [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\> \| [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\> | A `Validator` or `Converter` to convert the parsed JSON contents to the desired type. |

##### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

`Success` with the converted contents if successful, or
`Failure` with an error message otherwise.

##### Implementation of

`FileTree.IFileTreeFileItem.getContents`

***

### getRawContents()

> **getRawContents**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Gets the raw contents of the file as a string.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

#### Implementation of

`FileTree.IFileTreeFileItem.getRawContents`

***

### setContentType()

> **setContentType**(`contentType`): `void`

Sets the content type of the file.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `contentType` | `TCT` \| `undefined` | The content type of the file. |

#### Returns

`void`
