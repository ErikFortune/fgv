[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IConfectionEditJournalEntryEntity

# Interface: IConfectionEditJournalEntryEntity

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:93](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L93)

Journal entry for confection edits.

## Extends

- [`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md)\<[`AnyConfectionVersionEntity`](../type-aliases/AnyConfectionVersionEntity.md), [`ConfectionVersionId`](../../../../type-aliases/ConfectionVersionId.md)\>

## Properties

### baseId

> `readonly` **baseId**: [`BaseJournalId`](../../../../type-aliases/BaseJournalId.md)

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:65](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L65)

Base identifier within collection (no collection prefix)

#### Inherited from

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`baseId`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#baseid)

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:77](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L77)

Optional categorized notes about this entry

#### Inherited from

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`notes`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#notes)

***

### recipe

> `readonly` **recipe**: [`AnyConfectionVersionEntity`](../type-aliases/AnyConfectionVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:71](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L71)

Full source recipe/confection at the time of the entry

#### Inherited from

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`recipe`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#recipe)

***

### timestamp

> `readonly` **timestamp**: `string`

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:67](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L67)

Timestamp when this entry was created (ISO 8601 format)

#### Inherited from

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`timestamp`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#timestamp)

***

### type

> `readonly` **type**: `"confection-edit"`

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:95](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L95)

Entry type discriminator

#### Overrides

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`type`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#type)

***

### updated?

> `readonly` `optional` **updated**: [`AnyConfectionVersionEntity`](../type-aliases/AnyConfectionVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:73](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L73)

Full updated version if modifications were made

#### Inherited from

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`updated`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#updated)

***

### updatedId?

> `readonly` `optional` **updatedId**: [`ConfectionVersionId`](../../../../type-aliases/ConfectionVersionId.md)

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:75](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L75)

ID of the updated version if it was saved

#### Inherited from

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`updatedId`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#updatedid)

***

### versionId

> `readonly` **versionId**: [`ConfectionVersionId`](../../../../type-aliases/ConfectionVersionId.md)

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:69](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L69)

Source version ID for indexing and lookup

#### Inherited from

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`versionId`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#versionid)
