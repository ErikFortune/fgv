[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [JsonFile](../README.md) / JsonFsHelper

# Class: JsonFsHelper

Helper class to simplify common filesystem operations involving JSON (or JSON-like)
files.

## Constructors

### Constructor

> **new JsonFsHelper**(`init?`): `JsonFsHelper`

Construct a new JsonFsHelper.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `init?` | `Partial`\<[`IJsonFsHelperConfig`](../interfaces/IJsonFsHelperConfig.md)\> | Optional [init options](../type-aliases/JsonFsHelperInitOptions.md) to construct and JSON values. |

#### Returns

`JsonFsHelper`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="config"></a> `config` | `readonly` | [`IJsonFsHelperConfig`](../interfaces/IJsonFsHelperConfig.md) | Configuration for this JsonFsHelper. |

## Methods

### \_pathMatchesOptions()

> `protected` **\_pathMatchesOptions**\<`T`, `TC`\>(`options`, `path`): `boolean`

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |
| `TC` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`IJsonFsDirectoryOptions`](../interfaces/IJsonFsDirectoryOptions.md)\<`T`, `TC`\> |
| `path` | `string` |

#### Returns

`boolean`

***

### convertJsonDirectorySync()

> **convertJsonDirectorySync**\<`T`, `TC`\>(`srcPath`, `options`, `context?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReadDirectoryItem`](../interfaces/IReadDirectoryItem.md)\<`T`\>[]\>

Reads all JSON files from a directory and apply a supplied converter or validator.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `srcPath` | `string` | The path of the folder to be read. |
| `options` | [`IJsonFsDirectoryOptions`](../interfaces/IJsonFsDirectoryOptions.md)\<`T`\> | [Options](../interfaces/IJsonFsDirectoryOptions.md) to control conversion and filtering |
| `context?` | `TC` | - |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IReadDirectoryItem`](../interfaces/IReadDirectoryItem.md)\<`T`\>[]\>

***

### convertJsonDirectoryToMapSync()

> **convertJsonDirectoryToMapSync**\<`T`, `TC`\>(`srcPath`, `options`, `context?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Map`\<`string`, `T`\>\>

Reads and converts or validates all JSON files from a directory, returning a
`Map<string, T>` indexed by file base name (i.e. minus the extension)
with an optional name transformation applied if present.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `srcPath` | `string` | The path of the folder to be read. |
| `options` | [`IJsonFsDirectoryToMapOptions`](../interfaces/IJsonFsDirectoryToMapOptions.md)\<`T`, `TC`\> | [Options](../interfaces/IJsonFsDirectoryToMapOptions.md) to control conversion, filtering and naming. |
| `context?` | `unknown` | - |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Map`\<`string`, `T`\>\>

***

### convertJsonFileSync()

> **convertJsonFileSync**\<`T`, `TC`\>(`srcPath`, `cv`, `context?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Read a JSON file and apply a supplied converter or validator.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `srcPath` | `string` | Path of the file to read. |
| `cv` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> \| [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> | Converter or validator used to process the file. |
| `context?` | `TC` | - |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

`Success` with a result of type `<T>`, or `Failure`
with a message if an error occurs.

***

### readJsonFileSync()

> **readJsonFileSync**(`srcPath`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../../../type-aliases/JsonValue.md)\>

Read type-safe JSON from a file.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `srcPath` | `string` | Path of the file to read |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JsonValue`](../../../../type-aliases/JsonValue.md)\>

`Success` with a [JsonValue](../../../../type-aliases/JsonValue.md) or `Failure`
with a message if an error occurs.

***

### writeJsonFileSync()

> **writeJsonFileSync**(`srcPath`, `value`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Write type-safe JSON to a file.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `srcPath` | `string` | Path of the file to write. |
| `value` | [`JsonValue`](../../../../type-aliases/JsonValue.md) | The [JsonValue](../../../../type-aliases/JsonValue.md) to be written. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>
