[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Runtime](../../../README.md) / [Session](../README.md) / ISaveResult

# Interface: ISaveResult

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:221](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L221)

Result of saving an editing session

## Properties

### journalEntry?

> `readonly` `optional` **journalEntry**: [`IFillingEditJournalEntryEntity`](../../../../Entities/interfaces/IFillingEditJournalEntryEntity.md) \| [`IConfectionEditJournalEntryEntity`](../../../../Entities/interfaces/IConfectionEditJournalEntryEntity.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:231](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L231)

The full journal entry if one was created.
Callers can use this to persist the journal via `context.journals.addJournal(entry)`.

***

### journalId?

> `readonly` `optional` **journalId**: `string`

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:225](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L225)

The journal ID if a journal entry was created

***

### newVersionSpec?

> `readonly` `optional` **newVersionSpec**: [`FillingVersionSpec`](../../../../../../type-aliases/FillingVersionSpec.md) \| [`ConfectionVersionSpec`](../../../../../../type-aliases/ConfectionVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:236](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L236)

The new version spec if one was created
