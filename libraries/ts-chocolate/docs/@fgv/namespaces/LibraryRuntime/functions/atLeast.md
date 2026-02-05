[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / atLeast

# Function: atLeast()

> **atLeast**\<`T`\>(`min`, `getter`): [`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/filters.ts:211](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/filters.ts#L211)

Creates a filter for minimum value (inclusive).

## Type Parameters

### T

`T`

## Parameters

### min

`number`

Minimum value

### getter

(`item`) => `number` \| `undefined`

Function to get the numeric value

## Returns

[`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Filter that matches if value is greater than or equal to min
