[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IFilteredSuggestions

# Interface: IFilteredSuggestions\<TId\>

Filtered suggestions split by tier.

## Type Parameters

| Type Parameter |
| ------ |
| `TId` *extends* `string` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="catalog"></a> `catalog` | `readonly` | readonly [`ITypeaheadSuggestion`](ITypeaheadSuggestion.md)\<`TId`\>[] |
| <a id="priority"></a> `priority` | `readonly` | readonly [`ITypeaheadSuggestion`](ITypeaheadSuggestion.md)\<`TId`\>[] |
