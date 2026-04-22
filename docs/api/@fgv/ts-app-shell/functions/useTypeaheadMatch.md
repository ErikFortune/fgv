[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / useTypeaheadMatch

# Function: useTypeaheadMatch()

> **useTypeaheadMatch**\<`TId`\>(`suggestions`, `prioritySuggestions?`): [`ITypeaheadMatchResult`](../interfaces/ITypeaheadMatchResult.md)\<`TId`\>

Hook that provides typeahead matching and filtering with tiered priority support.

`findExactMatch` matches by exact id or case-insensitive name (checks priority first).
`resolveOnBlur` tries exact match, then single partial match (priority first).
`filterSuggestions` returns suggestions split by tier, filtered by substring match.

## Type Parameters

| Type Parameter |
| ------ |
| `TId` *extends* `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `suggestions` | readonly [`ITypeaheadSuggestion`](../interfaces/ITypeaheadSuggestion.md)\<`TId`\>[] | The full catalog of suggestions |
| `prioritySuggestions?` | readonly [`ITypeaheadSuggestion`](../interfaces/ITypeaheadSuggestion.md)\<`TId`\>[] | Optional priority suggestions shown first (e.g. recipe alternates) |

## Returns

[`ITypeaheadMatchResult`](../interfaces/ITypeaheadMatchResult.md)\<`TId`\>

Match and filter functions
