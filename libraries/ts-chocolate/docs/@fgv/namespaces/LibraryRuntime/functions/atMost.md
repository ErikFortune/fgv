[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / atMost

# Function: atMost()

> **atMost**\<`T`\>(`max`, `getter`): [`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/filters.ts:222](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/queries/filters.ts#L222)

Creates a filter for maximum value (inclusive).

## Type Parameters

### T

`T`

## Parameters

### max

`number`

Maximum value

### getter

(`item`) => `number` \| `undefined`

Function to get the numeric value

## Returns

[`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Filter that matches if value is less than or equal to max
