[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / inRange

# Function: inRange()

> **inRange**\<`T`\>(`min`, `max`, `getter`): [`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/filters.ts:184](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/filters.ts#L184)

Creates a filter for numeric range (inclusive).

## Type Parameters

### T

`T`

## Parameters

### min

Minimum value (inclusive), undefined for no minimum

`number` | `undefined`

### max

Maximum value (inclusive), undefined for no maximum

`number` | `undefined`

### getter

(`item`) => `number` \| `undefined`

Function to get the numeric value

## Returns

[`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Filter that matches if value is in range
