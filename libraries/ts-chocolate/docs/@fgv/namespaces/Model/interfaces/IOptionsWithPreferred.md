[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Model](../README.md) / IOptionsWithPreferred

# Interface: IOptionsWithPreferred\<TOption, TId\>

Defined in: [ts-chocolate/src/packlets/common/model.ts:193](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/common/model.ts#L193)

Collection of options (objects with IDs) with a preferred selection.
Use when options are objects containing IDs plus additional metadata.

## Type Parameters

### TOption

`TOption` *extends* [`IHasId`](IHasId.md)\<`TId`\>

The option object type (must have an `id` property)

### TId

`TId` *extends* `string`

The ID type for the preferred selection

## Properties

### options

> `readonly` **options**: readonly `TOption`[]

Defined in: [ts-chocolate/src/packlets/common/model.ts:195](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/common/model.ts#L195)

Available options

***

### preferredId?

> `readonly` `optional` **preferredId**: `TId`

Defined in: [ts-chocolate/src/packlets/common/model.ts:197](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/common/model.ts#L197)

ID of the preferred/recommended option
