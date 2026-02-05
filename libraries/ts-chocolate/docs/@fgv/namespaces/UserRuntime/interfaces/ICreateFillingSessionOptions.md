[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [UserRuntime](../README.md) / ICreateFillingSessionOptions

# Interface: ICreateFillingSessionOptions

Defined in: [ts-chocolate/src/packlets/user-runtime/model.ts:42](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/user-runtime/model.ts#L42)

Options for creating a new persisted filling session.

## Properties

### collectionId

> `readonly` **collectionId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/user-runtime/model.ts:44](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/user-runtime/model.ts#L44)

Target collection for the persisted session

***

### label?

> `readonly` `optional` **label**: `string`

Defined in: [ts-chocolate/src/packlets/user-runtime/model.ts:48](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/user-runtime/model.ts#L48)

Optional user-provided label

***

### status?

> `readonly` `optional` **status**: [`PersistedSessionStatus`](../../Entities/type-aliases/PersistedSessionStatus.md)

Defined in: [ts-chocolate/src/packlets/user-runtime/model.ts:46](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/user-runtime/model.ts#L46)

Initial session status (default: 'active')
