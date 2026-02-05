[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / toCollectionId

# Function: toCollectionId()

> **toCollectionId**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md)\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:91](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/common/validation.ts#L91)

Validates unknown value is a [CollectionId](../../../../type-aliases/CollectionId.md).

## Parameters

### from

`unknown`

Value to validate

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`CollectionId`](../../../../type-aliases/CollectionId.md)\>

`Success` with [CollectionId](../../../../type-aliases/CollectionId.md) or `Failure` with an error
message if validation fails.
