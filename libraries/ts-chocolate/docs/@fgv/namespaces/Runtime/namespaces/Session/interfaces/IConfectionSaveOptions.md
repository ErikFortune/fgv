[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Runtime](../../../README.md) / [Session](../README.md) / IConfectionSaveOptions

# Interface: IConfectionSaveOptions

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:452](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L452)

Options for saving a confection editing session

## Properties

### createJournalRecord?

> `readonly` `optional` **createJournalRecord**: `boolean`

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:456](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L456)

Whether to create a journal record

***

### createNewVersion?

> `readonly` `optional` **createNewVersion**: `boolean`

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:461](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L461)

Whether to create a new confection version from modifications

***

### journalNotes?

> `readonly` `optional` **journalNotes**: `string`

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:471](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L471)

Optional notes for the journal record

***

### saveLinkedRecipeSessions?

> `readonly` `optional` **saveLinkedRecipeSessions**: `boolean`

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:476](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L476)

Whether to save linked recipe sessions (default: true)

***

### versionLabel?

> `readonly` `optional` **versionLabel**: [`ConfectionVersionSpec`](../../../../../../type-aliases/ConfectionVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:466](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L466)

Version label for the new version (required if createNewVersion is true)
