[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-ollama](../README.md) / IOllamaDeleteResult

# Interface: IOllamaDeleteResult

Result of a delete. Returns a meaningful value rather than `Result<void>` (per repo standards —
`Result<void>` is an anti-pattern).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-deleted"></a> `deleted` | `readonly` | `true` | Always `true` — a failed delete surfaces as `Result.fail`, never `deleted: false`. |
| <a id="property-model"></a> `model` | `readonly` | `string` | The model that was deleted. |
