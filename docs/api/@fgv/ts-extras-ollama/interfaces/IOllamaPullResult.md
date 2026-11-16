[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-ollama](../README.md) / IOllamaPullResult

# Interface: IOllamaPullResult

Terminal result of a completed pull. Returns a meaningful value (not `Result<void>`): the final
status plus a count of progress chunks observed.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-chunkcount"></a> `chunkCount` | `readonly` | `number` | Number of progress chunks observed (useful for tests and diagnostics). |
| <a id="property-finalstatus"></a> `finalStatus` | `readonly` | `string` | The `status` of the final chunk, normally `'success'`. |
| <a id="property-model"></a> `model` | `readonly` | `string` | The model that was pulled. |
