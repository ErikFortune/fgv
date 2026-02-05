[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / hasAnyTag

# Function: hasAnyTag()

> **hasAnyTag**\<`T`\>(`tags`, `getter`): [`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/filters.ts:146](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/queries/filters.ts#L146)

Creates a filter that checks if item has any of the specified tags.

## Type Parameters

### T

`T`

## Parameters

### tags

`string`[]

Tags to search for (case-insensitive)

### getter

(`item`) => readonly `string`[]

Function to get tags array

## Returns

[`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Filter that matches if any tag is found
