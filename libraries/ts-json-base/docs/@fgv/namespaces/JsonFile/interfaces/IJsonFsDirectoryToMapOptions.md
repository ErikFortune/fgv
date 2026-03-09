[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [JsonFile](../README.md) / IJsonFsDirectoryToMapOptions

# Interface: IJsonFsDirectoryToMapOptions\<T, TC\>

Options controlling conversion of a directory to a `Map`.

## Extends

- [`IJsonFsDirectoryOptions`](IJsonFsDirectoryOptions.md)\<`T`, `TC`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | - |
| `TC` | `unknown` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="converter"></a> `converter` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> \| [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> | The converter used to convert incoming JSON objects. |
| <a id="files"></a> `files?` | `RegExp`[] | Filter applied to items in the directory |
| <a id="transformname"></a> `transformName?` | [`ItemNameTransformFunction`](../type-aliases/ItemNameTransformFunction.md)\<`T`\> | - |
