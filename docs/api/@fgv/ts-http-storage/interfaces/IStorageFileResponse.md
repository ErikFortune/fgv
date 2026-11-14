[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-http-storage](../README.md) / IStorageFileResponse

# Interface: IStorageFileResponse

Response for reading a file.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-contents"></a> `contents` | `readonly` | `string` | - |
| <a id="property-contenttype"></a> `contentType?` | `readonly` | `string` | - |
| <a id="property-encoding"></a> `encoding?` | `readonly` | [`StorageContentEncoding`](../type-aliases/StorageContentEncoding.md) | How `contents` is encoded. Absent means `'utf8'`. **Remarks** **This field describes what the server actually produced, not what the client asked for**, and a client must branch on it rather than on its own request. A provider that does not implement `'base64'` ignores the request and answers with UTF-8 text; a client that base64-decoded on the strength of having *asked* would corrupt every such response. Trusting the field instead makes an older or simpler provider degrade to today's behavior rather than to garbage. |
| <a id="property-path"></a> `path` | `readonly` | `string` | - |
