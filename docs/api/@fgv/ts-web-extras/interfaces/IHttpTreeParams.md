[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-web-extras](../README.md) / IHttpTreeParams

# Interface: IHttpTreeParams\<TCT\>

Configuration for creating HTTP-backed tree accessors.

## Extends

- [`IFileTreeInitParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tct"></a> `TCT` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-autosync"></a> `autoSync?` | `readonly` | `boolean` | - |
| <a id="property-baseurl"></a> `baseUrl` | `readonly` | `string` | - |
| <a id="property-contentencoding"></a> `contentEncoding?` | `readonly` | [`HttpContentEncoding`](../type-aliases/HttpContentEncoding.md) | Wire encoding to request for file contents. Default `'utf8'` — today's behavior, byte-identical. **Remarks** Set `'base64'` to make this store **byte-faithful**: the server sends the file's bytes rather than a lenient UTF-8 decode of them, and this tree is seeded with those bytes verbatim. That is what makes `getFileBytes()` honest here and what lets the optional strict-text capability (`FileTree.getFileTextStrict`) actually decide whether the stored bytes were valid UTF-8, instead of refusing for want of custody. It also makes reading genuinely binary content (images, PDFs) correct rather than lossy. The cost is roughly 33% more payload per file, which is why it is opt-in rather than the default. **Requesting it is not the same as getting it.** A server that does not implement base64 ignores the parameter and answers in UTF-8, saying so on the response; this store branches on what came back, not on what it asked for, so such a server degrades to today's behavior rather than to garbage. |
| <a id="property-fetchimpl"></a> `fetchImpl?` | `readonly` | \{(`input`, `init?`): `Promise`\<`Response`\>; (`input`, `init?`): `Promise`\<`Response`\>; \} | - |
| <a id="property-infercontenttype"></a> `inferContentType?` | `public` | [`ContentTypeFactory`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`TCT`\> | - |
| <a id="property-logger"></a> `logger?` | `readonly` | [`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`, `unknown`\> | - |
| <a id="property-mutable"></a> `mutable?` | `public` | `boolean` \| [`IFilterSpec`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | Controls mutability of the file tree. - `undefined` or `false`: No files are mutable. - `true`: All files are mutable. - `IFilterSpec`: Only files matching the filter are mutable. |
| <a id="property-namespace"></a> `namespace?` | `readonly` | `string` | - |
| <a id="property-prefix"></a> `prefix?` | `public` | `string` | - |
| <a id="property-userid"></a> `userId?` | `readonly` | `string` | - |
