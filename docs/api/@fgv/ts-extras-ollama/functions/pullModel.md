[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-ollama](../README.md) / pullModel

# Function: pullModel()

> **pullModel**(`client`, `params`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IOllamaPullResult`](../interfaces/IOllamaPullResult.md)\>\>

Pulls a model with streamed progress (`POST /api/pull`). Drives the upstream JSON-lines stream
internally, invoking `params.onProgress` once per chunk, and resolves the `Result` once the
stream terminates. Any upstream error — connection drop, registry 404, abort, or a throwing
`onProgress` — becomes a single `Failure`; success returns a meaningful [IOllamaPullResult](../interfaces/IOllamaPullResult.md)
rather than `Result<void>`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | `Ollama` | A client from [createOllamaClient](createOllamaClient.md). |
| `params` | [`IPullModelParams`](../interfaces/IPullModelParams.md) | [IPullModelParams](../interfaces/IPullModelParams.md) — the model, optional `insecure` flag, optional `onProgress` callback, and optional `AbortSignal`. |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IOllamaPullResult`](../interfaces/IOllamaPullResult.md)\>\>

`Promise<Result<IOllamaPullResult>>`.
