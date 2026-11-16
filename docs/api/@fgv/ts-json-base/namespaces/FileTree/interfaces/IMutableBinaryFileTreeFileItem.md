[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / IMutableBinaryFileTreeFileItem

# Interface: IMutableBinaryFileTreeFileItem\<TCT\>

Extended file item interface for files whose contents can be both read and written
as raw bytes.

## Remarks

This is an *optional capability* — use
[isMutableBinaryFileItem](../functions/isMutableBinaryFileItem.md) to narrow.

**At the accessors level**, only backing stores that persist bytes verbatim
implement the mutable half; stores that persist text (in-memory, `localStorage`,
HTTP JSON transport) implement only the read-only
[FileTree.IBinaryFileTreeAccessors](IBinaryFileTreeAccessors.md), because a byte write could not
round-trip.

**At the file-item level that distinction is not visible to the guard.**
[FileTree.FileItem](../classes/FileItem.md) implements this interface unconditionally and delegates to
its accessors, so `isMutableBinaryFileItem` is `true` for any `FileItem` — including
one backed by a text-persisting store, whose `setRawBytes` then returns a `Failure`.
Narrow the **accessors** with
[isMutableBinaryAccessors](../functions/isMutableBinaryAccessors.md) when you need
the capability check to be a success guarantee.

## Extends

- [`IBinaryFileTreeFileItem`](IBinaryFileTreeFileItem.md)\<`TCT`\>
- [`IMutableFileTreeFileItem`](IMutableFileTreeFileItem.md)\<`TCT`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-absolutepath"></a> `absolutePath` | `readonly` | `string` | The absolute path of the file. |
| <a id="property-basename"></a> `baseName` | `readonly` | `string` | The base name of the file (without extension) |
| <a id="property-contenttype"></a> `contentType` | `readonly` | `TCT` \| `undefined` | An optional content type (e.g. mime type) for the file. |
| <a id="property-extension"></a> `extension` | `readonly` | `string` | The extension of the file |
| <a id="property-name"></a> `name` | `readonly` | `string` | The name of the file |
| <a id="property-type"></a> `type` | `readonly` | `"file"` | Indicates that this [file tree item](../type-aliases/FileTreeItem.md) is a file. |

## Methods

### delete()

> **delete**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Deletes this file from its backing store.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

`Success` with `true` if the file was deleted, or `Failure` with an error message.

#### Inherited from

[`IMutableFileTreeFileItem`](IMutableFileTreeFileItem.md).[`delete`](IMutableFileTreeFileItem.md#delete)

***

### getContents()

#### Call Signature

> **getContents**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../../type-aliases/JsonValue.md)\>

Gets the contents of the file as parsed JSON.

##### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../../type-aliases/JsonValue.md)\>

`Success` with the parsed JSON-compatible contents if successful, or
`Failure` with an error message otherwise.

##### Inherited from

[`IBinaryFileTreeFileItem`](IBinaryFileTreeFileItem.md).[`getContents`](IBinaryFileTreeFileItem.md#getcontents)

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

##### Inherited from

[`IBinaryFileTreeFileItem`](IBinaryFileTreeFileItem.md).[`getContents`](IBinaryFileTreeFileItem.md#getcontents)

***

### getIsMutable()

> **getIsMutable**(): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`, [`SaveDetail`](../type-aliases/SaveDetail.md)\>

Indicates whether this file can be saved.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`, [`SaveDetail`](../type-aliases/SaveDetail.md)\>

`DetailedSuccess` with [FileTree.SaveCapability](../type-aliases/SaveCapability.md) if the file can be saved,
or `DetailedFailure` with [FileTree.SaveFailureReason](../type-aliases/SaveFailureReason.md) if it cannot.

#### Inherited from

[`IMutableFileTreeFileItem`](IMutableFileTreeFileItem.md).[`getIsMutable`](IMutableFileTreeFileItem.md#getismutable)

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

#### Inherited from

[`IBinaryFileTreeFileItem`](IBinaryFileTreeFileItem.md).[`getRawBytes`](IBinaryFileTreeFileItem.md#getrawbytes)

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
[IBinaryFileTreeFileItem](IBinaryFileTreeFileItem.md); narrow with
[isBinaryFileItem](../functions/isBinaryFileItem.md) and call
[getRawBytes](IBinaryFileTreeFileItem.md#getrawbytes) to read the
undecoded bytes — for a strict decode that fails loudly on malformed UTF-8:

```ts
new TextDecoder('utf-8', { fatal: true }).decode(bytes)
```

#### Inherited from

[`IBinaryFileTreeFileItem`](IBinaryFileTreeFileItem.md).[`getRawContents`](IBinaryFileTreeFileItem.md#getrawcontents)

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

#### Inherited from

[`IMutableFileTreeFileItem`](IMutableFileTreeFileItem.md).[`setContents`](IMutableFileTreeFileItem.md#setcontents)

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

#### Remarks

The string is encoded as UTF-8. To write bytes that are not valid UTF-8, narrow
with [isMutableBinaryFileItem](../functions/isMutableBinaryFileItem.md) and use
[setRawBytes](#setrawbytes) instead.

#### Inherited from

[`IMutableFileTreeFileItem`](IMutableFileTreeFileItem.md).[`setRawContents`](IMutableFileTreeFileItem.md#setrawcontents)
