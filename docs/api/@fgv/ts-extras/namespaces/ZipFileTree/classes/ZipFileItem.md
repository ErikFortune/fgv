[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [ZipFileTree](../README.md) / ZipFileItem

# Class: ZipFileItem\<TCT\>

Implementation of `FileTree.IFileTreeFileItem` for files in a ZIP archive.
ZIP files are read-only, so this item does not support mutation.
Use [isMutableFileItem](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) to check before attempting mutations.

## Remarks

ZIP entries are byte-native, so this item also implements the read half of the
optional binary capability (`FileTree.IBinaryFileTreeFileItem`) — use
`FileTree.isBinaryFileItem` to narrow and `getRawBytes()` to read the entry's
undecoded bytes.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Implements

- [`IBinaryFileTreeFileItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>
- [`IStrictTextFileTreeFileItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>

## Constructors

### Constructor

> **new ZipFileItem**\<`TCT`\>(`zipFilePath`, `contents`, `accessors`): `ZipFileItem`\<`TCT`\>

Constructor for ZipFileItem.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `zipFilePath` | `string` | The path of the file within the ZIP. |
| `contents` | `string` \| `Uint8Array`\<`ArrayBufferLike`\> | The pre-loaded contents of the entry, either as raw bytes or as already-decoded text. Text is encoded as UTF-8 for the byte accessor and is also retained verbatim, so supplying text never round-trips through a decode. |
| `accessors` | [`ZipFileTreeAccessors`](ZipFileTreeAccessors.md)\<`TCT`\> | The ZIP file tree accessors. |

#### Returns

`ZipFileItem`\<`TCT`\>

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-absolutepath"></a> `absolutePath` | `public readonly` | `string` | `undefined` | The absolute path of the file within the ZIP archive. |
| <a id="property-basename"></a> `baseName` | `public readonly` | `string` | `undefined` | The base name of the file (without extension) |
| <a id="property-extension"></a> `extension` | `public readonly` | `string` | `undefined` | The extension of the file |
| <a id="property-name"></a> `name` | `public readonly` | `string` | `undefined` | The name of the file |
| <a id="property-type"></a> `type` | `public readonly` | `"file"` | `'file'` | Indicates that this `FileTree.FileTreeItem` is a file. |

## Accessors

### contentType

#### Get Signature

> **get** **contentType**(): `TCT` \| `undefined`

The content type of the file.

##### Returns

`TCT` \| `undefined`

#### Implementation of

`FileTree.IBinaryFileTreeFileItem.contentType`

## Methods

### getContents()

#### Call Signature

> **getContents**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md)\>

Gets the contents of the file as parsed JSON.

##### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md)\>

##### Implementation of

`FileTree.IBinaryFileTreeFileItem.getContents`

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

`FileTree.IBinaryFileTreeFileItem.getContents`

***

### getRawBytes()

> **getRawBytes**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

Gets the raw bytes of the ZIP entry, with no text decoding applied.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

#### Remarks

The returned array is the item's internal buffer and must not be modified.

#### Implementation of

`FileTree.IBinaryFileTreeFileItem.getRawBytes`

***

### getRawContents()

> **getRawContents**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Gets the raw contents of the file as a string.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

#### Remarks

The entry's bytes are decoded as UTF-8 with the lenient WHATWG default, so
malformed input is silently replaced with U+FFFD. Use `getRawBytes()` for the
undecoded bytes — and `new TextDecoder('utf-8', { fatal: true }).decode(bytes)`
for a decode that fails loudly instead.

#### Implementation of

`FileTree.IBinaryFileTreeFileItem.getRawContents`

***

### getTextStrict()

> **getTextStrict**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Gets the file's contents, decoding UTF-8 strictly.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

`Success` with the decoded text; `Failure` if the entry's bytes are
not valid UTF-8, or if this item never held the original bytes.

#### Remarks

Decidable for an entry read out of the archive, which is byte-native: this
item holds exactly the bytes the archive carried. An item constructed from
already-decoded text fails instead — its bytes are a re-encode, so they are
well-formed UTF-8 by construction and a success would say nothing.

#### Implementation of

`FileTree.IStrictTextFileTreeFileItem.getTextStrict`

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
