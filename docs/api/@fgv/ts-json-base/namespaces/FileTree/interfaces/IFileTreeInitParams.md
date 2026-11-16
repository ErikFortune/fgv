[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / IFileTreeInitParams

# Interface: IFileTreeInitParams\<TCT\>

Initialization parameters for a file tree.

## Extended by

- [`IFsFileTreeInitParams`](IFsFileTreeInitParams.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-infercontenttype"></a> `inferContentType?` | [`ContentTypeFactory`](../type-aliases/ContentTypeFactory.md)\<`TCT`\> | - |
| <a id="property-mutable"></a> `mutable?` | `boolean` \| [`IFilterSpec`](IFilterSpec.md) | Controls mutability of the file tree. - `undefined` or `false`: No files are mutable. - `true`: All files are mutable. - `IFilterSpec`: Only files matching the filter are mutable. |
| <a id="property-prefix"></a> `prefix?` | `string` | - |
