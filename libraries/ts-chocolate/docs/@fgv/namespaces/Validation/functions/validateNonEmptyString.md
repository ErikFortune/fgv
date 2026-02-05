[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / validateNonEmptyString

# Function: validateNonEmptyString()

> **validateNonEmptyString**\<`T`\>(`value`, `fieldName`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:821](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/common/validation.ts#L821)

Validate that a string is not empty.

## Type Parameters

### T

`T` *extends* `string` = `string`

## Parameters

### value

`T`

Value to validate

### fieldName

`string`

Name of field for error message

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Result with validated string or failure with error message
