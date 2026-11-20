[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / IBinaryFileTreeFileItem

# Interface: IBinaryFileTreeFileItem\<TCT\>

Extended file item interface for files whose contents can be read as raw bytes.

## Remarks

This is an *optional capability* — it is deliberately not part of
[FileTree.IFileTreeFileItem](IFileTreeFileItem.md). Use
[isBinaryFileItem](../functions/isBinaryFileItem.md) to narrow.

**The file-item guard narrows the type; it does not promise the call succeeds.**
[FileTree.FileItem](../classes/FileItem.md) — the generic wrapper backing every adapter except zip —
implements this interface unconditionally and delegates to its accessors, reporting
an accessor that lacks the capability as a `Failure` rather than by omitting the
method. So `isBinaryFileItem` is `true` for any `FileItem` regardless of what backs
it. That mirrors the pre-existing `setRawContents` / `getIsMutable` shape on
[FileTree.IMutableFileTreeFileItem](IMutableFileTreeFileItem.md) rather than introducing a new convention.
For a capability check that *is* a success guarantee, narrow the **accessors** with
[isBinaryAccessors](../functions/isBinaryAccessors.md) instead; either way, handle
the returned `Result`.

## Extends

- [`IFileTreeFileItem`](IFileTreeFileItem.md)\<`TCT`\>

## Extended by

- [`IMutableBinaryFileTreeFileItem`](IMutableBinaryFileTreeFileItem.md)

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

### getContents()

#### Call Signature

> **getContents**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../../type-aliases/JsonValue.md)\>

Gets the contents of the file as parsed JSON.

##### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../../type-aliases/JsonValue.md)\>

`Success` with the parsed JSON-compatible contents if successful, or
`Failure` with an error message otherwise.

##### Inherited from

[`IFileTreeFileItem`](IFileTreeFileItem.md).[`getContents`](IFileTreeFileItem.md#getcontents)

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

[`IFileTreeFileItem`](IFileTreeFileItem.md).[`getContents`](IFileTreeFileItem.md#getcontents)

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
IBinaryFileTreeFileItem; narrow with
[isBinaryFileItem](../functions/isBinaryFileItem.md) and call
[getRawBytes](#getrawbytes) to read the
undecoded bytes — for a strict decode that fails loudly on malformed UTF-8:

```ts
new TextDecoder('utf-8', { fatal: true }).decode(bytes)
```

#### Inherited from

[`IFileTreeFileItem`](IFileTreeFileItem.md).[`getRawContents`](IFileTreeFileItem.md#getrawcontents)
