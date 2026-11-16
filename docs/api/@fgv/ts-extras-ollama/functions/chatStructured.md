[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-ollama](../README.md) / chatStructured

# Function: chatStructured()

> **chatStructured**\<`T`\>(`client`, `params`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IOllamaChatStructuredResult`](../interfaces/IOllamaChatStructuredResult.md)\<`T`\>\>\>

Single-turn grammar-constrained structured chat (`POST /api/chat` with `format` = full JSON
schema). The fidelity win over ai-assist's prompt-and-parse path is **grammar-constrained
sampling**: Ollama restricts the token sampler to the supplied schema, so the response is
structurally guaranteed to match.

The schema is the single source of truth: `schema.toJson()` (draft-07-sanitized) is sent as the
wire `format`, and the same `schema.validate()` checks the reply — they cannot drift. `T` flows
end-to-end from `JsonSchema.Static<typeof schema>`; no caller-supplied `T`, no cast.

Runs over the streaming chat path internally, assembling the full document from the stream
chunks and validating it whole — partial JSON has no validation value. (The design §4 sketch
said `stream: false`, but the locked OQ-3 amendment requires an `AbortSignal`, and the `ollama`
lib only threads a signal on the streaming path — its non-streaming request has no signal
plumbing. The streaming `AbortableAsyncIterator.abort()` is "the mechanism that already exists
for `pullModel`".) Any upstream error, abort, parse failure, or validation failure surfaces as a
single `Failure` with context.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `client` | `Ollama` | A client from [createOllamaClient](createOllamaClient.md). |
| `params` | [`IChatStructuredParams`](../interfaces/IChatStructuredParams.md)\<`T`\> | [IChatStructuredParams](../interfaces/IChatStructuredParams.md) — model, messages, the `JsonSchema` schema, and optional `options` / `keepAlive` / `signal`. |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IOllamaChatStructuredResult`](../interfaces/IOllamaChatStructuredResult.md)\<`T`\>\>\>

`Promise<Result<IOllamaChatStructuredResult<T>>>`.
