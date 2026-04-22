[**@fgv Monorepo API Documentation**](../../../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../../../../../README.md) / [Iana](../../../../../../../README.md) / [Jar](../../../../../README.md) / [LanguageSubtags](../../../README.md) / [Registry](../README.md) / IExtLangSubtagRegistryEntry

# Interface: IExtLangSubtagRegistryEntry

**`Internal`**

Strongly-typed JAR format extlang subtag entry

## Properties

| Property | Type |
| ------ | ------ |
| <a id="added"></a> `Added` | [`YearMonthDaySpec`](../type-aliases/YearMonthDaySpec.md) |
| <a id="comments"></a> `Comments?` | `string`[] |
| <a id="deprecated"></a> `Deprecated?` | [`YearMonthDaySpec`](../type-aliases/YearMonthDaySpec.md) |
| <a id="description"></a> `Description` | `string`[] |
| <a id="macrolanguage"></a> `Macrolanguage?` | [`LanguageSubtag`](../../../../../../LanguageSubtags/type-aliases/LanguageSubtag.md) |
| <a id="preferred-value"></a> `Preferred-Value` | [`ExtendedLanguageRange`](../../../../../../LanguageSubtags/type-aliases/ExtendedLanguageRange.md) |
| <a id="prefix"></a> `Prefix` | [`LanguageSubtag`](../../../../../../LanguageSubtags/type-aliases/LanguageSubtag.md)[] |
| <a id="scope"></a> `Scope?` | [`RegistryEntryScope`](../../../../../../LanguageSubtags/type-aliases/RegistryEntryScope.md) |
| <a id="subtag"></a> `Subtag` | [`ExtLangSubtag`](../../../../../../LanguageSubtags/type-aliases/ExtLangSubtag.md) |
| <a id="suppress-script"></a> `Suppress-Script?` | [`ScriptSubtag`](../../../../../../LanguageSubtags/type-aliases/ScriptSubtag.md) |
| <a id="type"></a> `Type` | `"extlang"` |
