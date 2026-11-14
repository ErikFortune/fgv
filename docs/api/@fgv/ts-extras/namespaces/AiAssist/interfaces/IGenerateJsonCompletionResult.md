[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IGenerateJsonCompletionResult

# Interface: IGenerateJsonCompletionResult\<T\>

Successful result of [AiAssist.generateJsonCompletion](../functions/generateJsonCompletion.md).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-raw"></a> `raw` | `readonly` | `string` | The raw response text returned by the provider. |
| <a id="property-response"></a> `response` | `readonly` | [`IAiCompletionResponse`](IAiCompletionResponse.md) | The full underlying completion response. |
| <a id="property-value"></a> `value` | `readonly` | `T` | The validated JSON value. |
