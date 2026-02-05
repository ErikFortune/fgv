[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / toBaseJournalId

# Function: toBaseJournalId()

> **toBaseJournalId**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`BaseJournalId`](../../../../type-aliases/BaseJournalId.md)\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:677](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/common/validation.ts#L677)

Validates unknown value is a [JournalBaseId](../../../../type-aliases/BaseJournalId.md).

## Parameters

### from

`unknown`

Value to validate

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`BaseJournalId`](../../../../type-aliases/BaseJournalId.md)\>

`Success` with [JournalBaseId](../../../../type-aliases/BaseJournalId.md) or `Failure` with an error
message if validation fails.
