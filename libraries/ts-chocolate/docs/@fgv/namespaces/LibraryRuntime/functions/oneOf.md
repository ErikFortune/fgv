[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / oneOf

# Function: oneOf()

> **oneOf**\<`T`, `V`\>(`allowed`, `getter`): [`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/filters.ts:289](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/queries/filters.ts#L289)

Creates a filter that checks if value is one of the allowed values.

## Type Parameters

### T

`T`

### V

`V`

## Parameters

### allowed

`V`[]

Allowed values

### getter

(`item`) => `V` \| `undefined`

Function to get the actual value

## Returns

[`FilterPredicate`](../type-aliases/FilterPredicate.md)\<`T`\>

Filter that matches if value is in allowed list
