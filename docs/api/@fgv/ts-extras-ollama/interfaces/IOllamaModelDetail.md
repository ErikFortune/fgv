[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-ollama](../README.md) / IOllamaModelDetail

# Interface: IOllamaModelDetail

GGUF / model detail block, common to `/api/tags`, `/api/ps`, and `/api/show`. All fields
optional — Ollama omits any it cannot determine.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-families"></a> `families?` | `readonly` | readonly `string`[] | All architecture families this model belongs to. |
| <a id="property-family"></a> `family?` | `readonly` | `string` | Primary architecture family, e.g. `'llama'`. |
| <a id="property-format"></a> `format?` | `readonly` | `string` | Storage format, e.g. `'gguf'`. |
| <a id="property-parametersize"></a> `parameterSize?` | `readonly` | `string` | Human-readable parameter count, e.g. `'8.0B'`. |
| <a id="property-parentmodel"></a> `parentModel?` | `readonly` | `string` | Parent model for fine-tunes / derived models. |
| <a id="property-quantizationlevel"></a> `quantizationLevel?` | `readonly` | `string` | Quantization level, e.g. `'Q4_0'`. |
