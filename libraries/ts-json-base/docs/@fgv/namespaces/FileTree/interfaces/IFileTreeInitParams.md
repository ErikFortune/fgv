[**@fgv/ts-json-base**](../../../../README.md)

***

[@fgv/ts-json-base](../../../../README.md) / [FileTree](../README.md) / IFileTreeInitParams

# Interface: IFileTreeInitParams\<TCT\>

Initialization parameters for a file tree.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="infercontenttype"></a> `inferContentType?` | [`ContentTypeFactory`](../type-aliases/ContentTypeFactory.md)\<`TCT`\> | - |
| <a id="mutable"></a> `mutable?` | `boolean` \| [`IFilterSpec`](IFilterSpec.md) | Controls mutability of the file tree. - `undefined` or `false`: No files are mutable. - `true`: All files are mutable. - `IFilterSpec`: Only files matching the filter are mutable. |
| <a id="prefix"></a> `prefix?` | `string` | - |
