[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / containsIgnoreCase

# Function: containsIgnoreCase()

> **containsIgnoreCase**\<`T`\>(`text`, `getter`): [`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/filters.ts:113](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/filters.ts#L113)

Creates a case-insensitive contains filter.

## Type Parameters

### T

`T`

## Parameters

### text

`string`

Text to search for

### getter

(`item`) => `string` \| `undefined`

Function to get the string to search in

## Returns

[`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Filter that matches if text is found
