[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toConditionPriority

# Function: toConditionPriority()

> **toConditionPriority**(`priority`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionPriority`](../../../type-aliases/ConditionPriority.md)\>

Converts a number to a [ConditionPriority](../../../type-aliases/ConditionPriority.md) if it is a valid priority.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `priority` | `number` | the number to convert |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionPriority`](../../../type-aliases/ConditionPriority.md)\>

`Success` with the converted [ConditionPriority](../../../type-aliases/ConditionPriority.md) if successful, or `Failure` with an
error message if not.
