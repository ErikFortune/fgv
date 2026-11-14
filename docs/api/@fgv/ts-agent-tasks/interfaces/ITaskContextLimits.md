[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskContextLimits

# Interface: ITaskContextLimits

Fixed ceilings on context input and output, independent of any budget.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-maxinputentries"></a> `maxInputEntries` | `readonly` | `number` | Most entries accepted in each of the input's `tasks`, `updates` and `unresolved`. |
| <a id="property-maxitems"></a> `maxItems` | `readonly` | `number` | Largest `maxItems` a budget may request, and so the most entries a receipt can hold. |
