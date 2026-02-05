[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / collectionContains

# Function: collectionContains()

> **collectionContains**\<`T`, `V`\>(`value`, `getter`): [`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/filters.ts:237](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/queries/filters.ts#L237)

Creates a filter that checks if a collection contains a value.

## Type Parameters

### T

`T`

### V

`V`

## Parameters

### value

`V`

Value to search for

### getter

(`item`) => readonly `V`[] \| `undefined`

Function to get the collection

## Returns

[`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Filter that matches if value is in collection
