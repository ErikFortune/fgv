[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-ollama](../README.md) / listRunning

# Function: listRunning()

> **listRunning**(`client`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IOllamaRunningModel`](../interfaces/IOllamaRunningModel.md)[]\>\>

Lists models currently loaded into memory (`GET /api/ps`). Each entry is normalized to
[IOllamaRunningModel](../interfaces/IOllamaRunningModel.md) (camelCase, `expiresAt` as a `Date`, `sizeVram` in bytes).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | `Ollama` | A client from [createOllamaClient](createOllamaClient.md). |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IOllamaRunningModel`](../interfaces/IOllamaRunningModel.md)[]\>\>

`Promise<Result<ReadonlyArray<IOllamaRunningModel>>>`; upstream / transport errors are
  captured as `Failure`.
