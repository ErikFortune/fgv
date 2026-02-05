[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / hasTag

# Function: hasTag()

> **hasTag**\<`T`\>(`tag`, `getter`): [`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/filters.ts:131](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/filters.ts#L131)

Creates a tag filter that checks if item has the specified tag.

## Type Parameters

### T

`T`

## Parameters

### tag

`string`

Tag to search for (case-insensitive)

### getter

(`item`) => readonly `string`[]

Function to get tags array

## Returns

[`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Filter that matches if tag is found
