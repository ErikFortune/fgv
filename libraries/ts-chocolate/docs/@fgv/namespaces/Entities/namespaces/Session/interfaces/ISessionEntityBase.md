[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Session](../README.md) / ISessionEntityBase

# Interface: ISessionEntityBase

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:139](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L139)

Common properties shared by all persisted session types.

## Extended by

- [`IConfectionSessionEntity`](../../../interfaces/IConfectionSessionEntity.md)
- [`IFillingSessionEntity`](../../../interfaces/IFillingSessionEntity.md)

## Properties

### baseId

> `readonly` **baseId**: [`BaseSessionId`](../../../../../../type-aliases/BaseSessionId.md)

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:141](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L141)

Base identifier within the collection (no collection prefix)

***

### createdAt

> `readonly` **createdAt**: `string`

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:147](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L147)

ISO 8601 timestamp when session was created

***

### destination?

> `readonly` `optional` **destination**: [`ISessionDestinationEntity`](ISessionDestinationEntity.md)

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:155](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L155)

Destination configuration for saving derived entities

***

### label?

> `readonly` `optional` **label**: `string`

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:151](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L151)

User-provided label for the session

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:153](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L153)

Optional categorized notes

***

### sessionType

> `readonly` **sessionType**: [`PersistedSessionType`](../type-aliases/PersistedSessionType.md)

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:143](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L143)

Session type discriminator

***

### status

> `readonly` **status**: [`PersistedSessionStatus`](../../../type-aliases/PersistedSessionStatus.md)

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:145](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L145)

Current lifecycle status

***

### updatedAt

> `readonly` **updatedAt**: `string`

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:149](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L149)

ISO 8601 timestamp when session was last updated
