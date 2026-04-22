[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toConditionSetHash

# Function: toConditionSetHash()

> **toConditionSetHash**(`hash`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionSetHash`](../../../type-aliases/ConditionSetHash.md)\>

Converts a string to a [ConditionSetHash](../../../type-aliases/ConditionSetHash.md) if it is a valid condition set hash.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `hash` | `string` | the string to convert |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ConditionSetHash`](../../../type-aliases/ConditionSetHash.md)\>

`Success` with the converted [ConditionSetHash](../../../type-aliases/ConditionSetHash.md) if successful, or `Failure` with an
error message if not.
