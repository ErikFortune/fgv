[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonFile](../README.md) / JsonTreeHelper

# Class: JsonTreeHelper

Helper class to work with JSON files using FileTree API (web-compatible).

## Constructors

### Constructor

> **new JsonTreeHelper**(`json?`): `JsonTreeHelper`

Construct a new JsonTreeHelper.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `json?` | [`IJsonLike`](../interfaces/IJsonLike.md) | Optional [IJsonLike](../interfaces/IJsonLike.md) used to process strings and JSON values. |

#### Returns

`JsonTreeHelper`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="json"></a> `json` | `readonly` | [`IJsonLike`](../interfaces/IJsonLike.md) | Configuration for this JsonTreeHelper. |

## Methods

### convertJsonDirectoryFromTree()

> **convertJsonDirectoryFromTree**\<`T`, `TC`\>(`fileTree`, `dirPath`, `cv`, `filePattern?`, `context?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadDirectoryItem`](../interfaces/IReadDirectoryItem.md)\<`T`\>[]\>

Reads all JSON files from a directory in a FileTree and applies a converter or validator.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fileTree` | [`FileTree`](../../FileTree/classes/FileTree.md) | The FileTree to read from |
| `dirPath` | `string` | The path of the directory within the tree |
| `cv` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> \| [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> | Converter or validator to apply to each JSON file |
| `filePattern?` | `RegExp` | Optional regex pattern to filter files (defaults to .json files) |
| `context?` | `TC` | Optional context for the converter/validator |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IReadDirectoryItem`](../interfaces/IReadDirectoryItem.md)\<`T`\>[]\>

Array of items with filename and converted content

***

### convertJsonDirectoryToMapFromTree()

> **convertJsonDirectoryToMapFromTree**\<`T`, `TC`\>(`fileTree`, `dirPath`, `cv`, `filePattern?`, `context?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Map`\<`string`, `T`\>\>

Reads and converts all JSON files from a directory in a FileTree,
returning a Map indexed by file base name.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fileTree` | [`FileTree`](../../FileTree/classes/FileTree.md) | The FileTree to read from |
| `dirPath` | `string` | The path of the directory within the tree |
| `cv` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> \| [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> | Converter or validator to apply to each JSON file |
| `filePattern?` | `RegExp` | Optional regex pattern to filter files |
| `context?` | `TC` | Optional context for the converter/validator |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Map`\<`string`, `T`\>\>

Map of basename to converted content

***

### convertJsonFromTree()

> **convertJsonFromTree**\<`T`, `TC`\>(`fileTree`, `filePath`, `cv`, `context?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

Read a JSON file from a FileTree and apply a supplied converter or validator.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fileTree` | [`FileTree`](../../FileTree/classes/FileTree.md) | The FileTree to read from |
| `filePath` | `string` | Path of the file to read within the tree |
| `cv` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> \| [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> | Converter or validator used to process the file. |
| `context?` | `TC` | Optional context for the converter/validator |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

`Success` with a result of type `<T>`, or `Failure`
with a message if an error occurs.

***

### readJsonFromTree()

> **readJsonFromTree**(`fileTree`, `filePath`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../../type-aliases/JsonValue.md)\>

Read type-safe JSON from a file in a FileTree.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fileTree` | [`FileTree`](../../FileTree/classes/FileTree.md) | The FileTree to read from |
| `filePath` | `string` | Path of the file to read within the tree |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../../type-aliases/JsonValue.md)\>

`Success` with a [JsonValue](../../../type-aliases/JsonValue.md) or `Failure`
with a message if an error occurs.
