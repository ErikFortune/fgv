[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IFillingSessionEntity

# Interface: IFillingSessionEntity

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:169](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L169)

Persisted filling editing session with full editing state.

Contains the complete undo/redo history so the session can be
restored to its exact editing state.

## Extends

- [`ISessionEntityBase`](../namespaces/Session/interfaces/ISessionEntityBase.md)

## Properties

### baseId

> `readonly` **baseId**: [`BaseSessionId`](../../../../type-aliases/BaseSessionId.md)

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:141](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L141)

Base identifier within the collection (no collection prefix)

#### Inherited from

[`ISessionEntityBase`](../namespaces/Session/interfaces/ISessionEntityBase.md).[`baseId`](../namespaces/Session/interfaces/ISessionEntityBase.md#baseid)

***

### createdAt

> `readonly` **createdAt**: `string`

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:147](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L147)

ISO 8601 timestamp when session was created

#### Inherited from

[`ISessionEntityBase`](../namespaces/Session/interfaces/ISessionEntityBase.md).[`createdAt`](../namespaces/Session/interfaces/ISessionEntityBase.md#createdat)

***

### destination?

> `readonly` `optional` **destination**: [`ISessionDestinationEntity`](../namespaces/Session/interfaces/ISessionDestinationEntity.md)

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:155](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L155)

Destination configuration for saving derived entities

#### Inherited from

[`ISessionEntityBase`](../namespaces/Session/interfaces/ISessionEntityBase.md).[`destination`](../namespaces/Session/interfaces/ISessionEntityBase.md#destination)

***

### history

> `readonly` **history**: [`ISerializedEditingHistoryEntity`](../namespaces/Session/interfaces/ISerializedEditingHistoryEntity.md)\<[`IProducedFillingEntity`](IProducedFillingEntity.md)\>

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:174](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L174)

Full editing history including undo/redo stacks

***

### label?

> `readonly` `optional` **label**: `string`

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:151](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L151)

User-provided label for the session

#### Inherited from

[`ISessionEntityBase`](../namespaces/Session/interfaces/ISessionEntityBase.md).[`label`](../namespaces/Session/interfaces/ISessionEntityBase.md#label)

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:153](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L153)

Optional categorized notes

#### Inherited from

[`ISessionEntityBase`](../namespaces/Session/interfaces/ISessionEntityBase.md).[`notes`](../namespaces/Session/interfaces/ISessionEntityBase.md#notes)

***

### sessionType

> `readonly` **sessionType**: `"filling"`

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:170](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L170)

Session type discriminator

#### Overrides

[`ISessionEntityBase`](../namespaces/Session/interfaces/ISessionEntityBase.md).[`sessionType`](../namespaces/Session/interfaces/ISessionEntityBase.md#sessiontype)

***

### sourceVersionId

> `readonly` **sourceVersionId**: [`FillingVersionId`](../../../../type-aliases/FillingVersionId.md)

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:172](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L172)

Source filling version being edited

***

### status

> `readonly` **status**: [`PersistedSessionStatus`](../type-aliases/PersistedSessionStatus.md)

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:145](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L145)

Current lifecycle status

#### Inherited from

[`ISessionEntityBase`](../namespaces/Session/interfaces/ISessionEntityBase.md).[`status`](../namespaces/Session/interfaces/ISessionEntityBase.md#status)

***

### updatedAt

> `readonly` **updatedAt**: `string`

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:149](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L149)

ISO 8601 timestamp when session was last updated

#### Inherited from

[`ISessionEntityBase`](../namespaces/Session/interfaces/ISessionEntityBase.md).[`updatedAt`](../namespaces/Session/interfaces/ISessionEntityBase.md#updatedat)
