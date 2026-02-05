[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / toJournalId

# Function: toJournalId()

> **toJournalId**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JournalId`](../../../../type-aliases/JournalId.md)\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:703](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/common/validation.ts#L703)

Validates unknown value is a [JournalId](../../../../type-aliases/JournalId.md) (composite).

## Parameters

### from

`unknown`

Value to validate

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JournalId`](../../../../type-aliases/JournalId.md)\>

`Success` with [JournalId](../../../../type-aliases/JournalId.md) or `Failure` with an error
message if validation fails.
