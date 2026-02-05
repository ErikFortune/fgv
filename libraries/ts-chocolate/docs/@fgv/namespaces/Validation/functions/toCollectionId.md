[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / toCollectionId

# Function: toCollectionId()

> **toCollectionId**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md)\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:91](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/common/validation.ts#L91)

Validates unknown value is a [CollectionId](../../../../type-aliases/CollectionId.md).

## Parameters

### from

`unknown`

Value to validate

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md)\>

`Success` with [CollectionId](../../../../type-aliases/CollectionId.md) or `Failure` with an error
message if validation fails.
