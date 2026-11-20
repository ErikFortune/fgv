[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Helpers](../README.md) / parseConditionSetTokenParts

# Function: parseConditionSetTokenParts()

> **parseConditionSetTokenParts**(`token`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IConditionTokenParts`](../interfaces/IConditionTokenParts.md)[]\>

Parses a condition set token string into an array of [condition token parts](../interfaces/IConditionTokenParts.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the conditions set token string to parse. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IConditionTokenParts`](../interfaces/IConditionTokenParts.md)[]\>

`Success` with the parts if successful, `Failure` with an error message if not.
