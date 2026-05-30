[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-bcp47](../../../README.md) / [Bcp47](../README.md) / ILanguageChooserOptions

# Interface: ILanguageChooserOptions

Options for [language tag list filter](../functions/choose.md) functions.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="filter"></a> `filter?` | `"none"` \| `"primaryLanguage"` | Indicates how to filter the language list - `'primaryLanguage'` indicates the each primary language should appear only once in the list in its most similar form. A filter value of `'none'` reports all matching variants of any primary language in order of similarity. Default is `'primaryLanguage'` |
| <a id="ultimatefallback"></a> `ultimateFallback?` | `string` \| [`ISubtags`](ISubtags.md) \| [`LanguageTag`](../classes/LanguageTag.md) | An optional [language specification](../type-aliases/LanguageSpec.md) indicating a language to be returned if the filter call would otherwise return an empty list (i.e. no languages match). |
| <a id="use"></a> `use?` | `"desiredLanguage"` \| `"availableLanguage"` | Indicates whether to return the matching language from the desired list or the available list. Default is `'availableLanguage'`. |
