[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / validateNumberRange

# Function: validateNumberRange()

> **validateNumberRange**(`value`, `fieldName`, `min`, `max`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`number`\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:881](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/common/validation.ts#L881)

Validate that a value is a number within a range.

## Parameters

### value

`unknown`

Value to validate

### fieldName

`string`

Name of field for error message

### min

`number`

Minimum value (inclusive)

### max

`number`

Maximum value (inclusive)

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`number`\>

Result with validated number or failure with error message
