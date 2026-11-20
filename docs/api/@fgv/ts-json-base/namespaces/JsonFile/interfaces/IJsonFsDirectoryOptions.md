[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonFile](../README.md) / IJsonFsDirectoryOptions

# Interface: IJsonFsDirectoryOptions\<T, TC\>

Options for directory conversion.
TODO: add filtering, allowed and excluded.

## Extended by

- [`IJsonFsDirectoryToMapOptions`](IJsonFsDirectoryToMapOptions.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` | - |
| <a id="type-parameter-tc"></a> `TC` | `unknown` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-converter"></a> `converter` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> \| [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> | The converter used to convert incoming JSON objects. |
| <a id="property-files"></a> `files?` | `RegExp`[] | Filter applied to items in the directory |
