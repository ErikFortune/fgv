[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Helpers](../README.md) / parseQualifierDefaultValueTokenParts

# Function: parseQualifierDefaultValueTokenParts()

> **parseQualifierDefaultValueTokenParts**(`token`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IQualifierDefaultValueTokenParts`](../interfaces/IQualifierDefaultValueTokenParts.md)\>

Parses a qualifier default value token string into its [parts](../interfaces/IQualifierDefaultValueTokenParts.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the token string to parse. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IQualifierDefaultValueTokenParts`](../interfaces/IQualifierDefaultValueTokenParts.md)\>

`Success` with the parts if successful, `Failure` with an error message if not.
