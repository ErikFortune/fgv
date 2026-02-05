[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / equals

# Function: equals()

> **equals**\<`T`, `V`\>(`expected`, `getter`): [`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/filters.ts:278](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/queries/filters.ts#L278)

Creates a filter for exact equality.

## Type Parameters

### T

`T`

### V

`V`

## Parameters

### expected

`V`

Expected value

### getter

(`item`) => `V` \| `undefined`

Function to get the actual value

## Returns

[`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Filter that matches if values are equal
