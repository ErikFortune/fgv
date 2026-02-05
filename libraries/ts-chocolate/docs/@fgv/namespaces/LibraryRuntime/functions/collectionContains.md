[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / collectionContains

# Function: collectionContains()

> **collectionContains**\<`T`, `V`\>(`value`, `getter`): [`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/filters.ts:237](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/queries/filters.ts#L237)

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
