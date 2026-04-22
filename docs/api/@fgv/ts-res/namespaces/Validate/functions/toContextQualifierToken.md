[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toContextQualifierToken

# Function: toContextQualifierToken()

> **toContextQualifierToken**(`token`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ContextQualifierToken`](../../../type-aliases/ContextQualifierToken.md)\>

Converts a string to a [ContextQualifierToken](../../../type-aliases/ContextQualifierToken.md) if it is a valid context qualifier token.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the string to convert |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ContextQualifierToken`](../../../type-aliases/ContextQualifierToken.md)\>

`Success` with the converted [ContextQualifierToken](../../../type-aliases/ContextQualifierToken.md) if successful, or `Failure` with an
error message if not.
