[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / IMutableFileTreeFileItem

# Interface: IMutableFileTreeFileItem\<TCT\>

Extended file item interface that supports mutation operations.
Use [isMutableFileItem](../functions/isMutableFileItem.md) type guard to narrow.

## Extends

- [`IFileTreeFileItem`](IFileTreeFileItem.md)\<`TCT`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="absolutepath"></a> `absolutePath` | `readonly` | `string` | The absolute path of the file. |
| <a id="basename"></a> `baseName` | `readonly` | `string` | The base name of the file (without extension) |
| <a id="contenttype"></a> `contentType` | `readonly` | `TCT` \| `undefined` | An optional content type (e.g. mime type) for the file. |
| <a id="extension"></a> `extension` | `readonly` | `string` | The extension of the file |
| <a id="name"></a> `name` | `readonly` | `string` | The name of the file |
| <a id="type"></a> `type` | `readonly` | `"file"` | Indicates that this [file tree item](../type-aliases/FileTreeItem.md) is a file. |

## Methods

### delete()

> **delete**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Deletes this file from its backing store.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

`Success` with `true` if the file was deleted, or `Failure` with an error message.

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

[`IFileTreeFileItem`](IFileTreeFileItem.md).[`getContents`](IFileTreeFileItem.md#getcontents)

#### Call Signature

> **getContents**\<`T`\>(`converter`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

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

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

`Success` with the converted contents if successful, or
`Failure` with an error message otherwise.

##### Inherited from

[`IFileTreeFileItem`](IFileTreeFileItem.md).[`getContents`](IFileTreeFileItem.md#getcontents)

***

### getIsMutable()

> **getIsMutable**(): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`, [`SaveDetail`](../type-aliases/SaveDetail.md)\>

Indicates whether this file can be saved.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`, [`SaveDetail`](../type-aliases/SaveDetail.md)\>

`DetailedSuccess` with [FileTree.SaveCapability](../type-aliases/SaveCapability.md) if the file can be saved,
or `DetailedFailure` with [FileTree.SaveFailureReason](../type-aliases/SaveFailureReason.md) if it cannot.

***

### getRawContents()

> **getRawContents**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Gets the raw contents of the file as a string.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

`Success` with the raw contents if successful, or
`Failure` with an error message otherwise.

#### Inherited from

[`IFileTreeFileItem`](IFileTreeFileItem.md).[`getRawContents`](IFileTreeFileItem.md#getrawcontents)

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
