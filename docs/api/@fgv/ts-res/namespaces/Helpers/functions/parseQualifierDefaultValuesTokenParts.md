[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Helpers](../README.md) / parseQualifierDefaultValuesTokenParts

# Function: parseQualifierDefaultValuesTokenParts()

> **parseQualifierDefaultValuesTokenParts**(`token`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IQualifierDefaultValueTokenParts`](../interfaces/IQualifierDefaultValueTokenParts.md)[]\>

Parses a qualifier default values token string into an array of [qualifier default value token parts](../interfaces/IQualifierDefaultValueTokenParts.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the qualifier default values token string to parse. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IQualifierDefaultValueTokenParts`](../interfaces/IQualifierDefaultValueTokenParts.md)[]\>

`Success` with the parts if successful, `Failure` with an error message if not.
