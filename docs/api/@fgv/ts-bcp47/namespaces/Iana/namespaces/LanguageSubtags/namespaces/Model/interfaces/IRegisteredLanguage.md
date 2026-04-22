[**@fgv Monorepo API Documentation**](../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../../../README.md) / [Iana](../../../../../README.md) / [LanguageSubtags](../../../README.md) / [Model](../README.md) / IRegisteredLanguage

# Interface: IRegisteredLanguage

## Extends

- [`IRegisteredSubtagWithRange`](IRegisteredSubtagWithRange.md)\<`"language"`, [`LanguageSubtag`](../../../type-aliases/LanguageSubtag.md)\>

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="added"></a> `added` | `readonly` | [`YearMonthDaySpec`](../../../../Jar/namespaces/LanguageSubtags/namespaces/Registry/type-aliases/YearMonthDaySpec.md) |
| <a id="comments"></a> `comments?` | `readonly` | `string`[] |
| <a id="deprecated"></a> `deprecated?` | `readonly` | [`YearMonthDaySpec`](../../../../Jar/namespaces/LanguageSubtags/namespaces/Registry/type-aliases/YearMonthDaySpec.md) |
| <a id="description"></a> `description` | `readonly` | `string`[] |
| <a id="macrolanguage"></a> `macrolanguage?` | `readonly` | [`LanguageSubtag`](../../../type-aliases/LanguageSubtag.md) |
| <a id="preferredvalue"></a> `preferredValue?` | `readonly` | [`LanguageSubtag`](../../../type-aliases/LanguageSubtag.md) |
| <a id="scope"></a> `scope?` | `readonly` | [`RegistryEntryScope`](../../../type-aliases/RegistryEntryScope.md) |
| <a id="subtag"></a> `subtag` | `readonly` | [`LanguageSubtag`](../../../type-aliases/LanguageSubtag.md) |
| <a id="subtagrangeend"></a> `subtagRangeEnd?` | `readonly` | [`LanguageSubtag`](../../../type-aliases/LanguageSubtag.md) |
| <a id="suppressscript"></a> `suppressScript?` | `readonly` | [`ScriptSubtag`](../../../type-aliases/ScriptSubtag.md) |
| <a id="type"></a> `type` | `readonly` | `"language"` |
