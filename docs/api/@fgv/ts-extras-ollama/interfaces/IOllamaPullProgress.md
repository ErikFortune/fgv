[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-ollama](../README.md) / IOllamaPullProgress

# Interface: IOllamaPullProgress

A single progress chunk from a streamed pull (`/api/pull`). Ollama emits a JSON-lines stream;
each line is one of these. Fields map 1:1 from the upstream `ProgressResponse`; the layer fields
(`digest`/`total`/`completed`) are `undefined` on the manifest / verify / write phases.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-completed"></a> `completed?` | `readonly` | `number` | Bytes transferred so far for the current layer, when known. |
| <a id="property-digest"></a> `digest?` | `readonly` | `string` | Layer digest being transferred (present during `'pulling <digest>'` phases). |
| <a id="property-status"></a> `status` | `readonly` | `string` | Phase string, e.g. `'pulling manifest'`, `'pulling <digest>'`, `'verifying sha256 digest'`, `'writing manifest'`, `'success'`. |
| <a id="property-total"></a> `total?` | `readonly` | `number` | Total bytes for the current layer, when known. |
