[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-ollama](../README.md) / IOllamaChatStructuredResult

# Interface: IOllamaChatStructuredResult\<T\>

Result of a grammar-constrained structured chat. Carries both the validated typed value and the
raw JSON text the model emitted, for diagnostics.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-donereason"></a> `doneReason?` | `readonly` | `string` | Provider-reported finish reason, when present. |
| <a id="property-model"></a> `model` | `readonly` | `string` | The model that produced the response. |
| <a id="property-raw"></a> `raw` | `readonly` | `string` | The raw `message.content` JSON string the model emitted (assembled across stream chunks). |
| <a id="property-value"></a> `value` | `readonly` | `T` | The parsed-and-validated value (validated by the same schema sent on the wire). |
