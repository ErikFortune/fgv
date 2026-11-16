[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-ollama](../README.md) / IOllamaRunningModel

# Interface: IOllamaRunningModel

A model currently loaded into memory (`/api/ps`). Note `/api/ps` does NOT return
`modified_at`, so this does not extend [IOllamaModel](IOllamaModel.md).

## Extends

- [`IOllamaModelBase`](IOllamaModelBase.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-details"></a> `details` | `readonly` | [`IOllamaModelDetail`](IOllamaModelDetail.md) | GGUF / architecture detail. |
| <a id="property-digest"></a> `digest` | `readonly` | `string` | SHA-256 manifest digest. |
| <a id="property-expiresat"></a> `expiresAt` | `readonly` | `Date` | When the model will be unloaded, parsed from the RFC3339 wire value. |
| <a id="property-model"></a> `model` | `readonly` | `string` | Underlying model id (often equal to `name`). |
| <a id="property-name"></a> `name` | `readonly` | `string` | Tagged name, e.g. `'llama3.1:8b'`. |
| <a id="property-size"></a> `size` | `readonly` | `number` | On-disk size in bytes. |
| <a id="property-sizevram"></a> `sizeVram` | `readonly` | `number` | Bytes resident in VRAM (0 when fully on CPU). |
