[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / notFilter

# Function: notFilter()

> **notFilter**\<`T`\>(`filter`): [`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/filters.ts:98](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/queries/filters.ts#L98)

Negates a filter.

## Type Parameters

### T

`T`

## Parameters

### filter

[`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Filter to negate

## Returns

[`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Filter that passes when original fails and vice versa
