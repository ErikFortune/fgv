[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / toBaseJournalId

# Function: toBaseJournalId()

> **toBaseJournalId**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`BaseJournalId`](../../../../type-aliases/BaseJournalId.md)\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:677](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/common/validation.ts#L677)

Validates unknown value is a [JournalBaseId](../../../../type-aliases/BaseJournalId.md).

## Parameters

### from

`unknown`

Value to validate

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`BaseJournalId`](../../../../type-aliases/BaseJournalId.md)\>

`Success` with [JournalBaseId](../../../../type-aliases/BaseJournalId.md) or `Failure` with an error
message if validation fails.
