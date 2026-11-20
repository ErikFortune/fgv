[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-ollama](../README.md) / IOllamaModel

# Interface: IOllamaModel

A model present in the local store (`/api/tags`).

## Extends

- [`IOllamaModelBase`](IOllamaModelBase.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-details"></a> `details` | `readonly` | [`IOllamaModelDetail`](IOllamaModelDetail.md) | GGUF / architecture detail. |
| <a id="property-digest"></a> `digest` | `readonly` | `string` | SHA-256 manifest digest. |
| <a id="property-model"></a> `model` | `readonly` | `string` | Underlying model id (often equal to `name`). |
| <a id="property-modifiedat"></a> `modifiedAt` | `readonly` | `Date` | Last-modified timestamp, parsed from the RFC3339 wire value. |
| <a id="property-name"></a> `name` | `readonly` | `string` | Tagged name, e.g. `'llama3.1:8b'`. |
| <a id="property-size"></a> `size` | `readonly` | `number` | On-disk size in bytes. |
