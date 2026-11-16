[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / ITypeaheadMatchResult

# Interface: ITypeaheadMatchResult\<TId\>

Result of the useTypeaheadMatch hook.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-tid"></a> `TId` *extends* `string` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-filtersuggestions"></a> `filterSuggestions` | (`input`) => [`IFilteredSuggestions`](IFilteredSuggestions.md)\<`TId`\> | Filter suggestions by input text, returning priority and catalog tiers separately. |
| <a id="property-findexactmatch"></a> `findExactMatch` | (`input`) => [`ITypeaheadSuggestion`](ITypeaheadSuggestion.md)\<`TId`\> \| `undefined` | Find an exact match by id or case-insensitive name. Checks priority first. |
| <a id="property-resolveonblur"></a> `resolveOnBlur` | (`input`) => [`ITypeaheadSuggestion`](ITypeaheadSuggestion.md)\<`TId`\> \| `undefined` | Resolve on blur: exact match → use it; single partial → use it; else undefined. |
