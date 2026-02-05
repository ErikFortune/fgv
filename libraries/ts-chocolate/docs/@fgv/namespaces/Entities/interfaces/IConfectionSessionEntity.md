[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IConfectionSessionEntity

# Interface: IConfectionSessionEntity

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:190](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L190)

Persisted confection editing session with full editing state.

Contains the complete undo/redo history so the session can be
restored to its exact editing state. References child filling
sessions by their persisted session IDs.

## Extends

- [`ISessionEntityBase`](../namespaces/Session/interfaces/ISessionEntityBase.md)

## Properties

### baseId

> `readonly` **baseId**: [`BaseSessionId`](../../../../type-aliases/BaseSessionId.md)

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:141](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L141)

Base identifier within the collection (no collection prefix)

#### Inherited from

[`ISessionEntityBase`](../namespaces/Session/interfaces/ISessionEntityBase.md).[`baseId`](../namespaces/Session/interfaces/ISessionEntityBase.md#baseid)

***

### childSessionIds

> `readonly` **childSessionIds**: `Readonly`\<`Record`\<[`SlotId`](../../../../type-aliases/SlotId.md), [`SessionId`](../../../../type-aliases/SessionId.md)\>\>

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:199](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L199)

Map of slot ID to child filling session ID

***

### confectionType

> `readonly` **confectionType**: [`ConfectionType`](../../../../type-aliases/ConfectionType.md)

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:193](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L193)

Confection type discriminator (for type-specific restoration)

***

### createdAt

> `readonly` **createdAt**: `string`

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:147](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L147)

ISO 8601 timestamp when session was created

#### Inherited from

[`ISessionEntityBase`](../namespaces/Session/interfaces/ISessionEntityBase.md).[`createdAt`](../namespaces/Session/interfaces/ISessionEntityBase.md#createdat)

***

### destination?

> `readonly` `optional` **destination**: [`ISessionDestinationEntity`](../namespaces/Session/interfaces/ISessionDestinationEntity.md)

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:155](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L155)

Destination configuration for saving derived entities

#### Inherited from

[`ISessionEntityBase`](../namespaces/Session/interfaces/ISessionEntityBase.md).[`destination`](../namespaces/Session/interfaces/ISessionEntityBase.md#destination)

***

### history

> `readonly` **history**: [`ISerializedEditingHistoryEntity`](../namespaces/Session/interfaces/ISerializedEditingHistoryEntity.md)\<[`AnyProducedConfectionEntity`](../type-aliases/AnyProducedConfectionEntity.md)\>

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:197](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L197)

Full editing history including undo/redo stacks

***

### label?

> `readonly` `optional` **label**: `string`

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:151](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L151)

User-provided label for the session

#### Inherited from

[`ISessionEntityBase`](../namespaces/Session/interfaces/ISessionEntityBase.md).[`label`](../namespaces/Session/interfaces/ISessionEntityBase.md#label)

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:153](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L153)

Optional categorized notes

#### Inherited from

[`ISessionEntityBase`](../namespaces/Session/interfaces/ISessionEntityBase.md).[`notes`](../namespaces/Session/interfaces/ISessionEntityBase.md#notes)

***

### sessionType

> `readonly` **sessionType**: `"confection"`

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:191](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L191)

Session type discriminator

#### Overrides

[`ISessionEntityBase`](../namespaces/Session/interfaces/ISessionEntityBase.md).[`sessionType`](../namespaces/Session/interfaces/ISessionEntityBase.md#sessiontype)

***

### sourceVersionId

> `readonly` **sourceVersionId**: [`ConfectionVersionId`](../../../../type-aliases/ConfectionVersionId.md)

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:195](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L195)

Source confection version being edited

***

### status

> `readonly` **status**: [`PersistedSessionStatus`](../type-aliases/PersistedSessionStatus.md)

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:145](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L145)

Current lifecycle status

#### Inherited from

[`ISessionEntityBase`](../namespaces/Session/interfaces/ISessionEntityBase.md).[`status`](../namespaces/Session/interfaces/ISessionEntityBase.md#status)

***

### updatedAt

> `readonly` **updatedAt**: `string`

Defined in: [ts-chocolate/src/packlets/entities/session/model.ts:149](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/session/model.ts#L149)

ISO 8601 timestamp when session was last updated

#### Inherited from

[`ISessionEntityBase`](../namespaces/Session/interfaces/ISessionEntityBase.md).[`updatedAt`](../namespaces/Session/interfaces/ISessionEntityBase.md#updatedat)
