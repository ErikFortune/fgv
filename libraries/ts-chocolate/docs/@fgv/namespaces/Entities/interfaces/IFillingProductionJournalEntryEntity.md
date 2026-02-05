[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IFillingProductionJournalEntryEntity

# Interface: IFillingProductionJournalEntryEntity

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:102](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L102)

Journal entry for filling production sessions.

## Extends

- [`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md)\<[`IFillingRecipeVersionEntity`](IFillingRecipeVersionEntity.md), [`FillingVersionId`](../../../../type-aliases/FillingVersionId.md)\>

## Properties

### baseId

> `readonly` **baseId**: [`BaseJournalId`](../../../../type-aliases/BaseJournalId.md)

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:65](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L65)

Base identifier within collection (no collection prefix)

#### Inherited from

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`baseId`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#baseid)

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:77](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L77)

Optional categorized notes about this entry

#### Inherited from

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`notes`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#notes)

***

### produced

> `readonly` **produced**: [`IProducedFillingEntity`](IProducedFillingEntity.md)

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:108](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L108)

Produced filling with resolved concrete choices

***

### recipe

> `readonly` **recipe**: [`IFillingRecipeVersionEntity`](IFillingRecipeVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:71](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L71)

Full source recipe/confection at the time of the entry

#### Inherited from

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`recipe`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#recipe)

***

### timestamp

> `readonly` **timestamp**: `string`

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:67](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L67)

Timestamp when this entry was created (ISO 8601 format)

#### Inherited from

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`timestamp`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#timestamp)

***

### type

> `readonly` **type**: `"filling-production"`

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:104](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L104)

Entry type discriminator

#### Overrides

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`type`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#type)

***

### updated?

> `readonly` `optional` **updated**: [`IFillingRecipeVersionEntity`](IFillingRecipeVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:73](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L73)

Full updated version if modifications were made

#### Inherited from

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`updated`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#updated)

***

### updatedId?

> `readonly` `optional` **updatedId**: [`FillingVersionId`](../../../../type-aliases/FillingVersionId.md)

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:75](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L75)

ID of the updated version if it was saved

#### Inherited from

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`updatedId`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#updatedid)

***

### versionId

> `readonly` **versionId**: [`FillingVersionId`](../../../../type-aliases/FillingVersionId.md)

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:69](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L69)

Source version ID for indexing and lookup

#### Inherited from

[`IJournalEntryEntityBase`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md).[`versionId`](../namespaces/Journal/interfaces/IJournalEntryEntityBase.md#versionid)

***

### yield

> `readonly` **yield**: [`Measurement`](../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/entities/journal/model.ts:106](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/journal/model.ts#L106)

Total yield weight of this production run
