[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [FileTree](../README.md) / FileItem

# Class: FileItem\<TCT\>

Class representing a file in a file tree.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

## Implements

- [`IFileTreeFileItem`](../interfaces/IFileTreeFileItem.md)\<`TCT`\>

## Constructors

### Constructor

> `protected` **new FileItem**\<`TCT`\>(`path`, `hal`): `FileItem`\<`TCT`\>

Protected constructor for derived classes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Relative path of the file. |
| `hal` | [`IFileTreeAccessors`](../interfaces/IFileTreeAccessors.md)\<`TCT`\> | The [accessors](../interfaces/IFileTreeAccessors.md) to use for file system operations. |

#### Returns

`FileItem`\<`TCT`\>

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="_contenttype"></a> `_contentType` | `public` | `TCT` \| `undefined` | `undefined` | Mutable content type of the file. |
| <a id="_hal"></a> `_hal` | `readonly` | [`IFileTreeAccessors`](../interfaces/IFileTreeAccessors.md)\<`TCT`\> | `undefined` | The [accessors](../interfaces/IFileTreeAccessors.md) to use for file system operations. |
| <a id="absolutepath"></a> `absolutePath` | `readonly` | `string` | `undefined` | The absolute path of the file. |
| <a id="type"></a> `type` | `readonly` | `"file"` | `'file'` | Indicates that this [file tree item](../type-aliases/FileTreeItem.md) is a file. |

## Accessors

### baseName

#### Get Signature

> **get** **baseName**(): `string`

The base name of the file (without extension)

##### Returns

`string`

The base name of the file (without extension)

#### Implementation of

[`IFileTreeFileItem`](../interfaces/IFileTreeFileItem.md).[`baseName`](../interfaces/IFileTreeFileItem.md#basename)

***

### contentType

#### Get Signature

> **get** **contentType**(): `TCT` \| `undefined`

An optional content type (e.g. mime type) for the file.

##### Returns

`TCT` \| `undefined`

An optional content type (e.g. mime type) for the file.

#### Implementation of

[`IFileTreeFileItem`](../interfaces/IFileTreeFileItem.md).[`contentType`](../interfaces/IFileTreeFileItem.md#contenttype)

***

### extension

#### Get Signature

> **get** **extension**(): `string`

The extension of the file

##### Returns

`string`

The extension of the file

#### Implementation of

[`IFileTreeFileItem`](../interfaces/IFileTreeFileItem.md).[`extension`](../interfaces/IFileTreeFileItem.md#extension)

***

### name

#### Get Signature

> **get** **name**(): `string`

The name of the file

##### Returns

`string`

The name of the file

#### Implementation of

[`IFileTreeFileItem`](../interfaces/IFileTreeFileItem.md).[`name`](../interfaces/IFileTreeFileItem.md#name)

## Methods

### getContents()

#### Call Signature

> **getContents**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../../../type-aliases/JsonValue.md)\>

Gets the contents of the file as parsed JSON.

##### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../../../type-aliases/JsonValue.md)\>

`Success` with the parsed JSON-compatible contents if successful, or
`Failure` with an error message otherwise.

##### Implementation of

[`IFileTreeFileItem`](../interfaces/IFileTreeFileItem.md).[`getContents`](../interfaces/IFileTreeFileItem.md#getcontents)

#### Call Signature

> **getContents**\<`T`\>(`converter`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Gets the contents of the file as parsed JSON, converted to a specific type.

##### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` |  |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `converter` | [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\> \| [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\> | A `Validator` or `Converter` to convert the parsed JSON contents to the desired type. |

##### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

`Success` with the converted contents if successful, or
`Failure` with an error message otherwise.

##### Implementation of

[`IFileTreeFileItem`](../interfaces/IFileTreeFileItem.md).[`getContents`](../interfaces/IFileTreeFileItem.md#getcontents)

***

### getIsMutable()

> **getIsMutable**(): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`, [`SaveDetail`](../type-aliases/SaveDetail.md)\>

Indicates whether this file can be saved.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`, [`SaveDetail`](../type-aliases/SaveDetail.md)\>

`DetailedSuccess` with [FileTree.SaveCapability](../type-aliases/SaveCapability.md) if the file can be saved,
or `DetailedFailure` with [FileTree.SaveFailureReason](../type-aliases/SaveFailureReason.md) if it cannot.

#### Remarks

This property is optional. If not present, the file is not mutable.

#### Implementation of

[`IFileTreeFileItem`](../interfaces/IFileTreeFileItem.md).[`getIsMutable`](../interfaces/IFileTreeFileItem.md#getismutable)

***

### getRawContents()

> **getRawContents**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Gets the raw contents of the file as a string.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

`Success` with the raw contents if successful, or
`Failure` with an error message otherwise.

#### Implementation of

[`IFileTreeFileItem`](../interfaces/IFileTreeFileItem.md).[`getRawContents`](../interfaces/IFileTreeFileItem.md#getrawcontents)

***

### setContents()

> **setContents**(`json`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../../../type-aliases/JsonValue.md)\>

Sets the contents of the file from a JSON value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `json` | [`JsonValue`](../../../../type-aliases/JsonValue.md) | The JSON value to serialize and save. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../../../type-aliases/JsonValue.md)\>

`Success` if the file was saved, or `Failure` with an error message.

#### Remarks

This method is optional. If not present, the file is not mutable.

#### Implementation of

[`IFileTreeFileItem`](../interfaces/IFileTreeFileItem.md).[`setContents`](../interfaces/IFileTreeFileItem.md#setcontents)

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

***

### setRawContents()

> **setRawContents**(`contents`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Sets the raw contents of the file.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `contents` | `string` | The string contents to save. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

`Success` if the file was saved, or `Failure` with an error message.

#### Remarks

This method is optional. If not present, the file is not mutable.

#### Implementation of

[`IFileTreeFileItem`](../interfaces/IFileTreeFileItem.md).[`setRawContents`](../interfaces/IFileTreeFileItem.md#setrawcontents)

***

### create()

> `static` **create**\<`TCT`\>(`path`, `hal`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`FileItem`\<`TCT`\>\>

Creates a new FileTree.FileItem instance.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Relative path of the file. |
| `hal` | [`IFileTreeAccessors`](../interfaces/IFileTreeAccessors.md)\<`TCT`\> | The [accessors](../interfaces/IFileTreeAccessors.md) to use for file system operations. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`FileItem`\<`TCT`\>\>

***

### defaultAcceptContentType()

> `static` **defaultAcceptContentType**\<`TCT`\>(`filePath`, `provided?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCT` \| `undefined`\>

Default function to accept the content type of a file.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The path of the file. |
| `provided?` | `TCT` | Optional supplied content type. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCT` \| `undefined`\>

`Success` with the content type of the file if successful, or
`Failure` with an error message otherwise.

#### Remarks

This default implementation always returns `Success` with `undefined`.

***

### defaultInferContentType()

> `static` **defaultInferContentType**\<`TCT`\>(`filePath`, `provided?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCT` \| `undefined`\>

Default function to infer the content type of a file.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The path of the file. |
| `provided?` | `string` | Optional supplied content type. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TCT` \| `undefined`\>

`Success` with the content type of the file if successful, or
`Failure` with an error message otherwise.

#### Remarks

This default implementation always returns `Success` with `undefined`.
