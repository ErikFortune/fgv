[**@fgv Monorepo API Documentation**](../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../../../README.md) / [Iana](../../../../../README.md) / [LanguageSubtags](../../../README.md) / [Model](../README.md) / IRegisteredLanguage

# Interface: IRegisteredLanguage

## Extends

- [`IRegisteredSubtagWithRange`](IRegisteredSubtagWithRange.md)\<`"language"`, [`LanguageSubtag`](../../../type-aliases/LanguageSubtag.md)\>

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-added"></a> `added` | `readonly` | [`YearMonthDaySpec`](../../../../Jar/namespaces/LanguageSubtags/namespaces/Registry/type-aliases/YearMonthDaySpec.md) |
| <a id="property-comments"></a> `comments?` | `readonly` | `string`[] |
| <a id="property-deprecated"></a> `deprecated?` | `readonly` | [`YearMonthDaySpec`](../../../../Jar/namespaces/LanguageSubtags/namespaces/Registry/type-aliases/YearMonthDaySpec.md) |
| <a id="property-description"></a> `description` | `readonly` | `string`[] |
| <a id="property-macrolanguage"></a> `macrolanguage?` | `readonly` | [`LanguageSubtag`](../../../type-aliases/LanguageSubtag.md) |
| <a id="property-preferredvalue"></a> `preferredValue?` | `readonly` | [`LanguageSubtag`](../../../type-aliases/LanguageSubtag.md) |
| <a id="property-scope"></a> `scope?` | `readonly` | [`RegistryEntryScope`](../../../type-aliases/RegistryEntryScope.md) |
| <a id="property-subtag"></a> `subtag` | `readonly` | [`LanguageSubtag`](../../../type-aliases/LanguageSubtag.md) |
| <a id="property-subtagrangeend"></a> `subtagRangeEnd?` | `readonly` | [`LanguageSubtag`](../../../type-aliases/LanguageSubtag.md) |
| <a id="property-suppressscript"></a> `suppressScript?` | `readonly` | [`ScriptSubtag`](../../../type-aliases/ScriptSubtag.md) |
| <a id="property-type"></a> `type` | `readonly` | `"language"` |
