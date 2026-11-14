[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskProgress

# Interface: ITaskProgress

Optional, advisory progress. Numeric completion never auto-succeeds a task, and an
unknown total is absent rather than zero.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-completed"></a> `completed?` | `readonly` | `number` |
| <a id="property-phase"></a> `phase?` | `readonly` | `string` |
| <a id="property-summary"></a> `summary?` | `readonly` | `string` |
| <a id="property-total"></a> `total?` | `readonly` | `number` |
| <a id="property-unit"></a> `unit?` | `readonly` | `string` |
