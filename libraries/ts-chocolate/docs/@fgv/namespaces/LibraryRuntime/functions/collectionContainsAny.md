[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / collectionContainsAny

# Function: collectionContainsAny()

> **collectionContainsAny**\<`T`, `V`\>(`values`, `getter`): [`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/filters.ts:254](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/filters.ts#L254)

Creates a filter that checks if a collection contains any of the values.

## Type Parameters

### T

`T`

### V

`V`

## Parameters

### values

`V`[]

Values to search for

### getter

(`item`) => readonly `V`[] \| `undefined`

Function to get the collection

## Returns

[`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Filter that matches if any value is in collection
