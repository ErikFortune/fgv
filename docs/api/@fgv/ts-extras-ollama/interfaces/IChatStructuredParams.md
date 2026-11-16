[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-ollama](../README.md) / IChatStructuredParams

# Interface: IChatStructuredParams\<T\>

Parameters for [chatStructured](../functions/chatStructured.md).

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-keepalive"></a> `keepAlive?` | `readonly` | `string` \| `number` | Native `keep_alive` (duration string or seconds). Passed verbatim — no policy applied. |
| <a id="property-messages"></a> `messages` | `readonly` | readonly [`IOllamaChatMessage`](IOllamaChatMessage.md)[] | The conversation so far. |
| <a id="property-model"></a> `model` | `readonly` | `string` | The model to chat with, e.g. `'llama3.1:8b'`. |
| <a id="property-options"></a> `options?` | `readonly` | `Readonly`\<`Record`\<`string`, [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md)\>\> | Native Ollama `options` (temperature, num_ctx, seed, …). Passed verbatim. |
| <a id="property-schema"></a> `schema` | `readonly` | [`ISchemaValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`T`\> | The single source of truth for both the wire schema (`schema.toJson()`, sent as the native `format` field) and the result validator (`schema.validate()`). Author with `JsonSchema.object(...)` from `@fgv/ts-json-base`; `T` is derived via `JsonSchema.Static<typeof schema>`. A runtime-discovered (MCP) schema parsed via `JsonSchema.fromJson(raw)` also works — its `T` is `JsonValue`. |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Abort signal. Cancels the in-flight generation; the upstream stream throws an `AbortError`, which surfaces as `Result.fail`. An already-aborted signal cancels immediately. |
