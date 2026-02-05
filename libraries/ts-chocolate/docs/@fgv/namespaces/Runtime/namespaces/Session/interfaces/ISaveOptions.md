[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Runtime](../../../README.md) / [Session](../README.md) / ISaveOptions

# Interface: ISaveOptions

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:195](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L195)

Options for saving an editing session

## Properties

### createJournalRecord?

> `readonly` `optional` **createJournalRecord**: `boolean`

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:199](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L199)

Whether to create a journal record

***

### createNewVersion?

> `readonly` `optional` **createNewVersion**: `boolean`

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:204](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L204)

Whether to create a new recipe version from modifications

***

### journalNotes?

> `readonly` `optional` **journalNotes**: `string`

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:214](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L214)

Optional notes for the journal record

***

### versionLabel?

> `readonly` `optional` **versionLabel**: [`FillingVersionSpec`](../../../../../../type-aliases/FillingVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:209](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L209)

Version label for the new version (required if createNewVersion is true)
