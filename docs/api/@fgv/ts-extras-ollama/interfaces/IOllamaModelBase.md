[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-ollama](../README.md) / IOllamaModelBase

# Interface: IOllamaModelBase

Fields common to a locally-stored model and a running model.

## Extended by

- [`IOllamaModel`](IOllamaModel.md)
- [`IOllamaRunningModel`](IOllamaRunningModel.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-details"></a> `details` | `readonly` | [`IOllamaModelDetail`](IOllamaModelDetail.md) | GGUF / architecture detail. |
| <a id="property-digest"></a> `digest` | `readonly` | `string` | SHA-256 manifest digest. |
| <a id="property-model"></a> `model` | `readonly` | `string` | Underlying model id (often equal to `name`). |
| <a id="property-name"></a> `name` | `readonly` | `string` | Tagged name, e.g. `'llama3.1:8b'`. |
| <a id="property-size"></a> `size` | `readonly` | `number` | On-disk size in bytes. |
