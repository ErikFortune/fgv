[**@fgv Monorepo API Documentation**](../../../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../../../../../README.md) / [Iana](../../../../../../../README.md) / [Jar](../../../../../README.md) / [LanguageSubtags](../../../README.md) / [Registry](../README.md) / IExtLangSubtagRegistryEntry

# Interface: IExtLangSubtagRegistryEntry

**`Internal`**

Strongly-typed JAR format extlang subtag entry

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-added"></a> `Added` | [`YearMonthDaySpec`](../type-aliases/YearMonthDaySpec.md) |
| <a id="property-comments"></a> `Comments?` | `string`[] |
| <a id="property-deprecated"></a> `Deprecated?` | [`YearMonthDaySpec`](../type-aliases/YearMonthDaySpec.md) |
| <a id="property-description"></a> `Description` | `string`[] |
| <a id="property-macrolanguage"></a> `Macrolanguage?` | [`LanguageSubtag`](../../../../../../LanguageSubtags/type-aliases/LanguageSubtag.md) |
| <a id="property-preferred-value"></a> `Preferred-Value` | [`ExtendedLanguageRange`](../../../../../../LanguageSubtags/type-aliases/ExtendedLanguageRange.md) |
| <a id="property-prefix"></a> `Prefix` | [`LanguageSubtag`](../../../../../../LanguageSubtags/type-aliases/LanguageSubtag.md)[] |
| <a id="property-scope"></a> `Scope?` | [`RegistryEntryScope`](../../../../../../LanguageSubtags/type-aliases/RegistryEntryScope.md) |
| <a id="property-subtag"></a> `Subtag` | [`ExtLangSubtag`](../../../../../../LanguageSubtags/type-aliases/ExtLangSubtag.md) |
| <a id="property-suppress-script"></a> `Suppress-Script?` | [`ScriptSubtag`](../../../../../../LanguageSubtags/type-aliases/ScriptSubtag.md) |
| <a id="property-type"></a> `Type` | `"extlang"` |
