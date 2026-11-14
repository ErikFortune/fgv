[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / IStrictTextFileTreeFileItem

# Interface: IStrictTextFileTreeFileItem\<TCT\>

Extended file item interface for files whose text can be decoded **strictly**.

## Remarks

An *optional capability*, mirroring
[IBinaryFileTreeFileItem](IBinaryFileTreeFileItem.md): narrow with
[isStrictTextFileItem](../functions/isStrictTextFileItem.md).

As with the binary guards, **the file-item guard narrows the type only and is
not a success guarantee** — [FileItem](../classes/FileItem.md) implements
this unconditionally and delegates, reporting a store that cannot honour it as
a `Failure` rather than omitting the method. Use
[isStrictTextAccessors](../functions/isStrictTextAccessors.md) when the check
itself must guarantee success.

## Extends

- [`IFileTreeFileItem`](IFileTreeFileItem.md)\<`TCT`\>

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

[`IFileTreeFileItem`](IFileTreeFileItem.md).[`getRawContents`](IFileTreeFileItem.md#getrawcontents)

***

### getTextStrict()

> **getTextStrict**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Gets the file's contents with a strict UTF-8 decode, failing on malformed
input rather than substituting U+FFFD.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>
