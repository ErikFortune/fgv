[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-ollama](../README.md) / deleteModel

# Function: deleteModel()

> **deleteModel**(`client`, `model`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IOllamaDeleteResult`](../interfaces/IOllamaDeleteResult.md)\>\>

Deletes a model from the local store (`DELETE /api/delete`). Returns a meaningful
[IOllamaDeleteResult](../interfaces/IOllamaDeleteResult.md) rather than `Result<void>`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | `Ollama` | A client from [createOllamaClient](createOllamaClient.md). |
| `model` | `string` | The model name to delete. |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IOllamaDeleteResult`](../interfaces/IOllamaDeleteResult.md)\>\>

`Promise<Result<IOllamaDeleteResult>>`; a missing model or transport error surfaces as
  `Failure`.
