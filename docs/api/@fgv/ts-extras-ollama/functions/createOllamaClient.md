[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-ollama](../README.md) / createOllamaClient

# Function: createOllamaClient()

> **createOllamaClient**(`params?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Ollama`\>

Constructs an Ollama client. Synchronous (the constructor performs no I/O), so returns
`Result<IOllamaClient>` rather than a promise. A malformed `host` (which the upstream
constructor rejects) surfaces as `Result.fail`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`ICreateOllamaClientParams`](../interfaces/ICreateOllamaClientParams.md) | Optional [ICreateOllamaClientParams](../interfaces/ICreateOllamaClientParams.md). Omitted fields fall back to the `ollama` library defaults. |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Ollama`\>

`Result<IOllamaClient>` wrapping the upstream `Ollama` instance.
