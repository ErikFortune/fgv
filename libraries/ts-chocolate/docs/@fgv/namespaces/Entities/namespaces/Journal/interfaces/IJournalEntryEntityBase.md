[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Journal](../README.md) / IJournalEntryEntityBase

# Interface: IJournalEntryEntityBase\<TVersion, TVersionId\>

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:61](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L61)

Base interface for journal entries.

## Extended by

- [`IConfectionProductionJournalEntryEntity`](../../../interfaces/IConfectionProductionJournalEntryEntity.md)
- [`IConfectionEditJournalEntryEntity`](../../../interfaces/IConfectionEditJournalEntryEntity.md)
- [`IFillingProductionJournalEntryEntity`](../../../interfaces/IFillingProductionJournalEntryEntity.md)
- [`IFillingEditJournalEntryEntity`](../../../interfaces/IFillingEditJournalEntryEntity.md)

## Type Parameters

### TVersion

`TVersion`

### TVersionId

`TVersionId`

## Properties

### baseId

> `readonly` **baseId**: [`BaseJournalId`](../../../../../../type-aliases/BaseJournalId.md)

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:65](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L65)

Base identifier within collection (no collection prefix)

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:77](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L77)

Optional categorized notes about this entry

***

### recipe

> `readonly` **recipe**: `TVersion`

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:71](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L71)

Full source recipe/confection at the time of the entry

***

### timestamp

> `readonly` **timestamp**: `string`

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:67](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L67)

Timestamp when this entry was created (ISO 8601 format)

***

### type

> `readonly` **type**: [`JournalEntryType`](../../../type-aliases/JournalEntryType.md)

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:63](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L63)

Entry type discriminator

***

### updated?

> `readonly` `optional` **updated**: `TVersion`

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:73](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L73)

Full updated version if modifications were made

***

### updatedId?

> `readonly` `optional` **updatedId**: `TVersionId`

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:75](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L75)

ID of the updated version if it was saved

***

### versionId

> `readonly` **versionId**: `TVersionId`

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:69](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L69)

Source version ID for indexing and lookup
