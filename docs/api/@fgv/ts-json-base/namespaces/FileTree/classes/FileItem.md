[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / FileItem

# Class: FileItem\<TCT\>

Class representing a file in a file tree.

## Remarks

Implements the optional binary capability
([FileTree.IMutableBinaryFileTreeFileItem](../interfaces/IMutableBinaryFileTreeFileItem.md)) and the optional strict-text
capability ([FileTree.IStrictTextFileTreeFileItem](../interfaces/IStrictTextFileTreeFileItem.md)) by delegating to the
underlying accessors. As with
[setRawContents](#setrawcontents) and
[getIsMutable](#getismutable), the byte methods and
[getTextStrict](#gettextstrict) report an accessor that
lacks the capability as a `Failure` rather than by omitting the method.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Implements

- [`IMutableBinaryFileTreeFileItem`](../interfaces/IMutableBinaryFileTreeFileItem.md)\<`TCT`\>
- [`IStrictTextFileTreeFileItem`](../interfaces/IStrictTextFileTreeFileItem.md)\<`TCT`\>

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
| <a id="property-_contenttype"></a> `_contentType` | `public` | `TCT` \| `undefined` | `undefined` | Mutable content type of the file. |
| <a id="property-_hal"></a> `_hal` | `public readonly` | [`IFileTreeAccessors`](../interfaces/IFileTreeAccessors.md)\<`TCT`\> | `undefined` | The [accessors](../interfaces/IFileTreeAccessors.md) to use for file system operations. |
| <a id="property-absolutepath"></a> `absolutePath` | `public readonly` | `string` | `undefined` | The absolute path of the file. |
| <a id="property-type"></a> `type` | `public readonly` | `"file"` | `'file'` | Indicates that this [file tree item](../type-aliases/FileTreeItem.md) is a file. |

## Accessors

### baseName

#### Get Signature

> **get** **baseName**(): `string`

The base name of the file (without extension)

##### Returns

`string`

The base name of the file (without extension)

#### Implementation of

[`IStrictTextFileTreeFileItem`](../interfaces/IStrictTextFileTreeFileItem.md).[`baseName`](../interfaces/IStrictTextFileTreeFileItem.md#property-basename)

***

### contentType

#### Get Signature

> **get** **contentType**(): `TCT` \| `undefined`

An optional content type (e.g. mime type) for the file.

##### Returns

`TCT` \| `undefined`

An optional content type (e.g. mime type) for the file.

#### Implementation of

[`IStrictTextFileTreeFileItem`](../interfaces/IStrictTextFileTreeFileItem.md).[`contentType`](../interfaces/IStrictTextFileTreeFileItem.md#property-contenttype)

***

### extension

#### Get Signature

> **get** **extension**(): `string`

The extension of the file

##### Returns

`string`

The extension of the file

#### Implementation of

[`IStrictTextFileTreeFileItem`](../interfaces/IStrictTextFileTreeFileItem.md).[`extension`](../interfaces/IStrictTextFileTreeFileItem.md#property-extension)

***

### name

#### Get Signature

> **get** **name**(): `string`

The name of the file

##### Returns

`string`

The name of the file

#### Implementation of

[`IStrictTextFileTreeFileItem`](../interfaces/IStrictTextFileTreeFileItem.md).[`name`](../interfaces/IStrictTextFileTreeFileItem.md#property-name)

## Methods

### delete()

> **delete**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Deletes this file from its backing store.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

`Success` with `true` if the file was deleted, or `Failure` with an error message.

#### Implementation of

[`IMutableBinaryFileTreeFileItem`](../interfaces/IMutableBinaryFileTreeFileItem.md).[`delete`](../interfaces/IMutableBinaryFileTreeFileItem.md#delete)

***

### getContents()

#### Call Signature

> **getContents**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../../type-aliases/JsonValue.md)\>

Gets the contents of the file as parsed JSON.

##### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../../type-aliases/JsonValue.md)\>

`Success` with the parsed JSON-compatible contents if successful, or
`Failure` with an error message otherwise.

##### Implementation of

[`IStrictTextFileTreeFileItem`](../interfaces/IStrictTextFileTreeFileItem.md).[`getContents`](../interfaces/IStrictTextFileTreeFileItem.md#getcontents)

#### Call Signature

> **getContents**\<`T`\>(`converter`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

Gets the contents of the file as parsed JSON, converted to a specific type.

##### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

##### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `converter` | [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\> \| [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\> | A `Validator` or `Converter` to convert the parsed JSON contents to the desired type. |

##### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

`Success` with the converted contents if successful, or
`Failure` with an error message otherwise.

##### Implementation of

[`IStrictTextFileTreeFileItem`](../interfaces/IStrictTextFileTreeFileItem.md).[`getContents`](../interfaces/IStrictTextFileTreeFileItem.md#getcontents)

***

### getIsMutable()

> **getIsMutable**(): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`, [`SaveDetail`](../type-aliases/SaveDetail.md)\>

Indicates whether this file can be saved.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`, [`SaveDetail`](../type-aliases/SaveDetail.md)\>

`DetailedSuccess` with [FileTree.SaveCapability](../type-aliases/SaveCapability.md) if the file can be saved,
or `DetailedFailure` with [FileTree.SaveFailureReason](../type-aliases/SaveFailureReason.md) if it cannot.

#### Implementation of

[`IMutableBinaryFileTreeFileItem`](../interfaces/IMutableBinaryFileTreeFileItem.md).[`getIsMutable`](../interfaces/IMutableBinaryFileTreeFileItem.md#getismutable)

***

### getRawBytes()

> **getRawBytes**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

Gets the raw contents of the file as bytes, with no text decoding applied.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

`Success` with the raw bytes if successful, or `Failure` with an
error message otherwise.

#### Remarks

The returned array must be treated as read-only — implementations are free to
return their internal buffer rather than a copy.

#### Implementation of

[`IMutableBinaryFileTreeFileItem`](../interfaces/IMutableBinaryFileTreeFileItem.md).[`getRawBytes`](../interfaces/IMutableBinaryFileTreeFileItem.md#getrawbytes)

***

### getRawContents()

> **getRawContents**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Gets the raw contents of the file as a string.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

`Success` with the raw contents if successful, or
`Failure` with an error message otherwise.

#### Remarks

The bytes are decoded as UTF-8 with the *lenient* WHATWG default, so malformed
input is silently replaced with U+FFFD rather than reported. Accessors whose
backing store is byte-native also implement
[IBinaryFileTreeFileItem](../interfaces/IBinaryFileTreeFileItem.md); narrow with
[isBinaryFileItem](../functions/isBinaryFileItem.md) and call
[getRawBytes](../interfaces/IBinaryFileTreeFileItem.md#getrawbytes) to read the
undecoded bytes — for a strict decode that fails loudly on malformed UTF-8:

```ts
new TextDecoder('utf-8', { fatal: true }).decode(bytes)
```

#### Implementation of

[`IStrictTextFileTreeFileItem`](../interfaces/IStrictTextFileTreeFileItem.md).[`getRawContents`](../interfaces/IStrictTextFileTreeFileItem.md#getrawcontents)

***

### getTextStrict()

> **getTextStrict**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Gets the file's contents with a strict UTF-8 decode, failing on malformed
input rather than substituting U+FFFD.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

#### Implementation of

[`IStrictTextFileTreeFileItem`](../interfaces/IStrictTextFileTreeFileItem.md).[`getTextStrict`](../interfaces/IStrictTextFileTreeFileItem.md#gettextstrict)

***

### setContents()

> **setContents**(`json`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../../type-aliases/JsonValue.md)\>

Sets the contents of the file from a JSON value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `json` | [`JsonValue`](../../../type-aliases/JsonValue.md) | The JSON value to serialize and save. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../../type-aliases/JsonValue.md)\>

`Success` if the file was saved, or `Failure` with an error message.

#### Implementation of

[`IMutableBinaryFileTreeFileItem`](../interfaces/IMutableBinaryFileTreeFileItem.md).[`setContents`](../interfaces/IMutableBinaryFileTreeFileItem.md#setcontents)

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

### setRawBytes()

> **setRawBytes**(`bytes`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

Sets the raw contents of the file from bytes, with no text encoding applied.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `bytes` | `Uint8Array` | The bytes to save. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

`Success` with the bytes that were saved, or `Failure` with an error message.

#### Implementation of

[`IMutableBinaryFileTreeFileItem`](../interfaces/IMutableBinaryFileTreeFileItem.md).[`setRawBytes`](../interfaces/IMutableBinaryFileTreeFileItem.md#setrawbytes)

***

### setRawContents()

> **setRawContents**(`contents`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Sets the raw contents of the file.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `contents` | `string` | The string contents to save. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

`Success` if the file was saved, or `Failure` with an error message.

#### Implementation of

[`IMutableBinaryFileTreeFileItem`](../interfaces/IMutableBinaryFileTreeFileItem.md).[`setRawContents`](../interfaces/IMutableBinaryFileTreeFileItem.md#setrawcontents)

***

### create()

> `static` **create**\<`TCT`\>(`path`, `hal`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`FileItem`\<`TCT`\>\>

Creates a new FileTree.FileItem instance.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct-1"></a> `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `path` | `string` | Relative path of the file. |
| `hal` | [`IFileTreeAccessors`](../interfaces/IFileTreeAccessors.md)\<`TCT`\> | The [accessors](../interfaces/IFileTreeAccessors.md) to use for file system operations. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`FileItem`\<`TCT`\>\>

***

### defaultAcceptContentType()

> `static` **defaultAcceptContentType**\<`TCT`\>(`filePath`, `provided?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`TCT` \| `undefined`\>

Default function to accept the content type of a file.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct-2"></a> `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The path of the file. |
| `provided?` | `TCT` | Optional supplied content type. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`TCT` \| `undefined`\>

`Success` with the content type of the file if successful, or
`Failure` with an error message otherwise.

#### Remarks

This default implementation always returns `Success` with `undefined`.

***

### defaultInferContentType()

> `static` **defaultInferContentType**\<`TCT`\>(`filePath`, `provided?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`TCT` \| `undefined`\>

Default function to infer the content type of a file.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct-3"></a> `TCT` *extends* `string` | `string` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `filePath` | `string` | The path of the file. |
| `provided?` | `string` | Optional supplied content type. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`TCT` \| `undefined`\>

`Success` with the content type of the file if successful, or
`Failure` with an error message otherwise.

#### Remarks

This default implementation always returns `Success` with `undefined`.
