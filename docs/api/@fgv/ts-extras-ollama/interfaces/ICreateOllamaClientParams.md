[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-ollama](../README.md) / ICreateOllamaClientParams

# Interface: ICreateOllamaClientParams

Construction parameters for an Ollama client. All optional; defaults match the `ollama` JS
library (host `http://127.0.0.1:11434`).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-fetch"></a> `fetch?` | `readonly` | \{(`input`, `init?`): `Promise`\<`Response`\>; (`input`, `init?`): `Promise`\<`Response`\>; \} | Custom `fetch` implementation. Injecting a fetch is the primary unit-test seam and the hook for a future proxy / browser path. |
| <a id="property-headers"></a> `headers?` | `readonly` | `Record`\<`string`, `string`\> | Custom headers included on every request (e.g. an auth token for a guarded sidecar). |
| <a id="property-host"></a> `host?` | `readonly` | `string` | Server address. Defaults to `http://127.0.0.1:11434`. |
