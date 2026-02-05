[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / validateUniqueBaseId

# Function: validateUniqueBaseId()

> **validateUniqueBaseId**\<`T`\>(`baseId`, `existingIds`, `fieldName`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:923](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/common/validation.ts#L923)

Validate that a base ID is unique in a collection.

## Type Parameters

### T

`T` *extends* `string` = `string`

## Parameters

### baseId

`T`

Base ID to validate

### existingIds

Collection of existing IDs

`ReadonlySet`\<`T`\> | readonly `T`[]

### fieldName

`string` = `'baseId'`

Name of field for error message

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Result with validated ID or failure with error message
