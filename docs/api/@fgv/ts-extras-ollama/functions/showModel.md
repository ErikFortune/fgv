[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-ollama](../README.md) / showModel

# Function: showModel()

> **showModel**(`client`, `model`, `options?`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IOllamaModelInfo`](../interfaces/IOllamaModelInfo.md)\>\>

Full model detail, capabilities, parameters, and template (`POST /api/show`), normalized to
[IOllamaModelInfo](../interfaces/IOllamaModelInfo.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | `Ollama` | A client from [createOllamaClient](createOllamaClient.md). |
| `model` | `string` | The model name to inspect, e.g. `'llama3.1:8b'`. |
| `options?` | \{ `verbose?`: `boolean`; \} | Optional flags. `verbose: true` requests the full low-level `model_info` block. |
| `options.verbose?` | `boolean` | - |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IOllamaModelInfo`](../interfaces/IOllamaModelInfo.md)\>\>

`Promise<Result<IOllamaModelInfo>>`; upstream / transport errors (e.g. unknown model)
  are captured as `Failure`.
