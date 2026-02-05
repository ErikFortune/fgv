[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Validation](../README.md) / toJournalId

# Function: toJournalId()

> **toJournalId**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JournalId`](../../../../type-aliases/JournalId.md)\>

Defined in: [ts-chocolate/src/packlets/common/validation.ts:703](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/common/validation.ts#L703)

Validates unknown value is a [JournalId](../../../../type-aliases/JournalId.md) (composite).

## Parameters

### from

`unknown`

Value to validate

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JournalId`](../../../../type-aliases/JournalId.md)\>

`Success` with [JournalId](../../../../type-aliases/JournalId.md) or `Failure` with an error
message if validation fails.
