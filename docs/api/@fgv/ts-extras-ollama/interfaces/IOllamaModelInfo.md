[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-ollama](../README.md) / IOllamaModelInfo

# Interface: IOllamaModelInfo

Full model detail, capabilities, parameters, and template (`POST /api/show`).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-capabilities"></a> `capabilities?` | `readonly` | readonly `string`[] | Declared capabilities, e.g. `['completion', 'tools', 'vision', 'thinking']`. |
| <a id="property-details"></a> `details` | `readonly` | [`IOllamaModelDetail`](IOllamaModelDetail.md) | GGUF / architecture detail. |
| <a id="property-modelfile"></a> `modelfile?` | `readonly` | `string` | The Modelfile source, when returned. |
| <a id="property-modelinfo"></a> `modelInfo?` | `readonly` | `Readonly`\<`Record`\<`string`, [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>\> | Low-level model metadata key-value map (`model_info`). |
| <a id="property-parameters"></a> `parameters?` | `readonly` | `string` | Default parameters string. |
| <a id="property-template"></a> `template?` | `readonly` | `string` | The prompt template. |
