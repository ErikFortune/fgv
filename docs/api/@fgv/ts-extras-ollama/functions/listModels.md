[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-ollama](../README.md) / listModels

# Function: listModels()

> **listModels**(`client`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IOllamaModel`](../interfaces/IOllamaModel.md)[]\>\>

Lists models in the local store (`GET /api/tags`). Each entry is normalized to
[IOllamaModel](../interfaces/IOllamaModel.md) (camelCase, `modifiedAt` as a `Date`).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | `Ollama` | A client from [createOllamaClient](createOllamaClient.md). |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IOllamaModel`](../interfaces/IOllamaModel.md)[]\>\>

`Promise<Result<ReadonlyArray<IOllamaModel>>>`; upstream / transport errors are captured
  as `Failure`.
