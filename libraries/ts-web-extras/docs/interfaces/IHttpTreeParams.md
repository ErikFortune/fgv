[**@fgv/ts-web-extras**](../README.md)

***

[@fgv/ts-web-extras](../README.md) / IHttpTreeParams

# Interface: IHttpTreeParams\<TCT\>

Configuration for creating HTTP-backed tree accessors.

## Extends

- [`IFileTreeInitParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="autosync"></a> `autoSync?` | `readonly` | `boolean` | - |
| <a id="baseurl"></a> `baseUrl` | `readonly` | `string` | - |
| <a id="fetchimpl"></a> `fetchImpl?` | `readonly` | \{(`input`, `init?`): `Promise`\<`Response`\>; (`input`, `init?`): `Promise`\<`Response`\>; \} | - |
| <a id="infercontenttype"></a> `inferContentType?` | `public` | [`ContentTypeFactory`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\> | - |
| <a id="mutable"></a> `mutable?` | `public` | `boolean` \| [`IFilterSpec`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | Controls mutability of the file tree. - `undefined` or `false`: No files are mutable. - `true`: All files are mutable. - `IFilterSpec`: Only files matching the filter are mutable. |
| <a id="namespace"></a> `namespace?` | `readonly` | `string` | - |
| <a id="prefix"></a> `prefix?` | `public` | `string` | - |
