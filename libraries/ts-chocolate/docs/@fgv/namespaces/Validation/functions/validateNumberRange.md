[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / validateNumberRange

# Function: validateNumberRange()

> **validateNumberRange**(`value`, `fieldName`, `min`, `max`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`number`\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:881](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/common/validation.ts#L881)

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
