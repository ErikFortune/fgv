[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-http-storage](../README.md) / IStorageReadFileRequest

# Interface: IStorageReadFileRequest

Request for reading a file, with an optional preferred content encoding.

## Remarks

`encoding` is a *preference*, not a demand: a provider that cannot honour it
answers in `'utf8'` and says so on [IStorageFileResponse.encoding](IStorageFileResponse.md#property-encoding). The
response is the authority.

## Extends

- [`IStoragePathRequest`](IStoragePathRequest.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-encoding"></a> `encoding?` | `readonly` | [`StorageContentEncoding`](../type-aliases/StorageContentEncoding.md) | Preferred wire encoding for the response's `contents`. Absent means `'utf8'`. **Remarks** A preference, not a demand — see [IStorageFileResponse.encoding](IStorageFileResponse.md#property-encoding), which reports what the server actually produced and is the field a client must branch on. |
| <a id="property-namespace"></a> `namespace?` | `readonly` | `string` | - |
| <a id="property-path"></a> `path` | `readonly` | `string` | - |
