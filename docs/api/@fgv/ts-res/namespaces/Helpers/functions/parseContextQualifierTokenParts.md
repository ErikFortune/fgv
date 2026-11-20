[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Helpers](../README.md) / parseContextQualifierTokenParts

# Function: parseContextQualifierTokenParts()

> **parseContextQualifierTokenParts**(`token`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IContextTokenParts`](../interfaces/IContextTokenParts.md)\>

Parses a context qualifier token string into its [parts](../interfaces/IContextTokenParts.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the token string to parse. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IContextTokenParts`](../interfaces/IContextTokenParts.md)\>

`Success` with the parts if successful, `Failure` with an error message if not.
