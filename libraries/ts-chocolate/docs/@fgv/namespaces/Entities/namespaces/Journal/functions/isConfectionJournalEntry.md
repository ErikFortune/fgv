[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Journal](../README.md) / isConfectionJournalEntry

# Function: isConfectionJournalEntry()

> **isConfectionJournalEntry**(`entry`): `entry is AnyConfectionJournalEntry`

Defined in: [ts-chocolate/src/packlets/entities/journal/library.ts:106](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/journal/library.ts#L106)

Type guard for confection journal entries

## Parameters

### entry

[`AnyJournalEntryEntity`](../../../type-aliases/AnyJournalEntryEntity.md)

Journal entry to check

## Returns

`entry is AnyConfectionJournalEntry`

True if the entry is a confection journal entry (edit or production)
