[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Validate](../README.md) / toQualifierMatchScore

# Function: toQualifierMatchScore()

> **toQualifierMatchScore**(`value`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierMatchScore`](../../../type-aliases/QualifierMatchScore.md)\>

Converts a number to a [match score](../../../type-aliases/QualifierMatchScore.md) if it is a valid score.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `number` | The number to convert. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierMatchScore`](../../../type-aliases/QualifierMatchScore.md)\>

`Success` with the converted score if successful, or `Failure` with an error message
if not.
