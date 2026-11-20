[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toContextToken

# Function: toContextToken()

> **toContextToken**(`token`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ContextToken`](../../../type-aliases/ContextToken.md)\>

Converts a string to a [ContextToken](../../../type-aliases/ContextToken.md) if it is a valid context token.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the string to convert |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ContextToken`](../../../type-aliases/ContextToken.md)\>

`Success` with the converted [ContextToken](../../../type-aliases/ContextToken.md) if successful, or `Failure` with an
error message if not.
