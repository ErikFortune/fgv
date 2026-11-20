[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toCandidateValueKey

# Function: toCandidateValueKey()

> **toCandidateValueKey**(`key`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`CandidateValueKey`](../../../type-aliases/CandidateValueKey.md)\>

Converts a string to a [candidate value key](../../../type-aliases/CandidateValueKey.md).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | The key to convert. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`CandidateValueKey`](../../../type-aliases/CandidateValueKey.md)\>

`Success` with the converted key if valid, or `Failure` with an error message
if not.
