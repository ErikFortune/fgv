[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / orFilters

# Function: orFilters()

> **orFilters**\<`T`\>(...`filters`): [`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/filters.ts:78](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/filters.ts#L78)

Combines multiple filters with OR logic.

## Type Parameters

### T

`T`

## Parameters

### filters

...[`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>[]

Filters to combine

## Returns

[`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Combined filter that passes if any filter passes
