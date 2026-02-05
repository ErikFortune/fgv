[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IConfectionProductionJournalEntryEntity

# Interface: IConfectionProductionJournalEntryEntity

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:115](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L115)

Journal entry for confection production sessions.

## Extends

- [`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md)\<[`AnyConfectionVersionEntity`](../type-aliases/AnyConfectionVersionEntity.md), [`ConfectionVersionId`](../../../../type-aliases/ConfectionVersionId.md)\>

## Properties

### baseId

> `readonly` **baseId**: [`BaseJournalId`](../../../../type-aliases/BaseJournalId.md)

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:65](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L65)

Base identifier within collection (no collection prefix)

#### Inherited from

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`baseId`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#baseid)

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:77](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L77)

Optional categorized notes about this entry

#### Inherited from

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`notes`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#notes)

***

### produced

> `readonly` **produced**: [`AnyProducedConfectionEntity`](../type-aliases/AnyProducedConfectionEntity.md)

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:121](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L121)

Produced confection with resolved concrete choices

***

### recipe

> `readonly` **recipe**: [`AnyConfectionVersionEntity`](../type-aliases/AnyConfectionVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:71](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L71)

Full source recipe/confection at the time of the entry

#### Inherited from

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`recipe`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#recipe)

***

### timestamp

> `readonly` **timestamp**: `string`

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:67](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L67)

Timestamp when this entry was created (ISO 8601 format)

#### Inherited from

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`timestamp`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#timestamp)

***

### type

> `readonly` **type**: `"confection-production"`

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:117](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L117)

Entry type discriminator

#### Overrides

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`type`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#type)

***

### updated?

> `readonly` `optional` **updated**: [`AnyConfectionVersionEntity`](../type-aliases/AnyConfectionVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:73](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L73)

Full updated version if modifications were made

#### Inherited from

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`updated`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#updated)

***

### updatedId?

> `readonly` `optional` **updatedId**: [`ConfectionVersionId`](../../../../type-aliases/ConfectionVersionId.md)

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:75](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L75)

ID of the updated version if it was saved

#### Inherited from

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`updatedId`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#updatedid)

***

### versionId

> `readonly` **versionId**: [`ConfectionVersionId`](../../../../type-aliases/ConfectionVersionId.md)

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:69](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L69)

Source version ID for indexing and lookup

#### Inherited from

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`versionId`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#versionid)

***

### yield

> `readonly` **yield**: [`IConfectionYield`](IConfectionYield.md)

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:119](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L119)

Yield specification for this production run
