[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Model](../README.md) / IIdsWithPreferred

# Interface: IIdsWithPreferred\<TId\>

Defined in: [ts-chocolate/src/packlets/common/model.ts:207](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/common/model.ts#L207)

Collection of simple IDs with a preferred selection.
Use when options are just IDs without additional metadata.

## Type Parameters

### TId

`TId` *extends* `string`

The ID type

## Properties

### ids

> `readonly` **ids**: readonly `TId`[]

Defined in: [ts-chocolate/src/packlets/common/model.ts:211](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/common/model.ts#L211)

Available option IDs

***

### preferredId?

> `readonly` `optional` **preferredId**: `TId`

Defined in: [ts-chocolate/src/packlets/common/model.ts:213](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/common/model.ts#L213)

The preferred/recommended ID

***

### slotId?

> `readonly` `optional` **slotId**: [`SlotId`](../../../../type-aliases/SlotId.md)

Defined in: [ts-chocolate/src/packlets/common/model.ts:209](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/common/model.ts#L209)

Optional slot identifier
