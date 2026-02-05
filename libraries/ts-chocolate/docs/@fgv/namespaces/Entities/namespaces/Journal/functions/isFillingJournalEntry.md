[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Journal](../README.md) / isFillingJournalEntry

# Function: isFillingJournalEntry()

> **isFillingJournalEntry**(`entry`): `entry is AnyFillingJournalEntry`

Defined in: [ts-chocolate/src/packlets/entities/journal/library.ts:96](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/journal/library.ts#L96)

Type guard for filling journal entries

## Parameters

### entry

[`AnyJournalEntryEntity`](../../../type-aliases/AnyJournalEntryEntity.md)

Journal entry to check

## Returns

`entry is AnyFillingJournalEntry`

True if the entry is a filling journal entry (edit or production)
