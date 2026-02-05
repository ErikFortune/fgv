[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / validateStringLength

# Function: validateStringLength()

> **validateStringLength**\<`T`\>(`value`, `fieldName`, `options`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:837](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/common/validation.ts#L837)

Validate string length constraints.

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

### options

Length constraints

#### maxLength?

`number`

#### minLength?

`number`

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Result with validated string or failure with error message
