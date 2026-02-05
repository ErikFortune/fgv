[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Journal](../README.md) / isConfectionJournalEntry

# Function: isConfectionJournalEntry()

> **isConfectionJournalEntry**(`entry`): `entry is AnyConfectionJournalEntry`

Defined in: [ts-chocolate/src/packlets/entities/journal/library.ts:106](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/journal/library.ts#L106)

Type guard for confection journal entries

## Parameters

### entry

[`AnyJournalEntryEntity`](../../../type-aliases/AnyJournalEntryEntity.md)

Journal entry to check

## Returns

`entry is AnyConfectionJournalEntry`

True if the entry is a confection journal entry (edit or production)
