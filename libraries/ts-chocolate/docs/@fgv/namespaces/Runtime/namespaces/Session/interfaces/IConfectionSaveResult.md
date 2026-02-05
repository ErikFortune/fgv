[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Runtime](../../../README.md) / [Session](../README.md) / IConfectionSaveResult

# Interface: IConfectionSaveResult

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:483](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L483)

Result of saving a confection editing session

## Properties

### journalEntry?

> `readonly` `optional` **journalEntry**: [`IConfectionEditJournalEntryEntity`](../../../../Entities/interfaces/IConfectionEditJournalEntryEntity.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:492](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L492)

The full journal entry if one was created

***

### journalId?

> `readonly` `optional` **journalId**: `string`

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:487](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L487)

The journal ID if a journal entry was created

***

### linkedRecipeJournalIds?

> `readonly` `optional` **linkedRecipeJournalIds**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:502](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L502)

Journal IDs of linked recipe sessions that were saved

***

### newVersionSpec?

> `readonly` `optional` **newVersionSpec**: [`ConfectionVersionSpec`](../../../../../../type-aliases/ConfectionVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:497](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L497)

The new version spec if one was created
