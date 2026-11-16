[**@fgv Monorepo API Documentation**](../../../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../../../../../README.md) / [Iana](../../../../../../../README.md) / [Jar](../../../../../README.md) / [LanguageSubtags](../../../README.md) / [Registry](../README.md) / IRegistrySubtagEntry

# Interface: IRegistrySubtagEntry\<TTYPE, TSUBTAG\>

**`Internal`**

## Extends

- [`IRegistryEntryBase`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs)\<`TTYPE`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-ttype"></a> `TTYPE` *extends* [`RegistryEntryType`](../../../../../../LanguageSubtags/type-aliases/RegistryEntryType.md) | [`RegistryEntryType`](../../../../../../LanguageSubtags/type-aliases/RegistryEntryType.md) |
| <a id="type-parameter-tsubtag"></a> `TSUBTAG` *extends* `string` | `string` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-added"></a> `Added` | [`YearMonthDaySpec`](../type-aliases/YearMonthDaySpec.md) |
| <a id="property-comments"></a> `Comments?` | `string`[] |
| <a id="property-deprecated"></a> `Deprecated?` | [`YearMonthDaySpec`](../type-aliases/YearMonthDaySpec.md) |
| <a id="property-description"></a> `Description` | `string`[] |
| <a id="property-macrolanguage"></a> `Macrolanguage?` | [`LanguageSubtag`](../../../../../../LanguageSubtags/type-aliases/LanguageSubtag.md) |
| <a id="property-preferred-value"></a> `Preferred-Value?` | `string` |
| <a id="property-prefix"></a> `Prefix?` | `string`[] |
| <a id="property-scope"></a> `Scope?` | [`RegistryEntryScope`](../../../../../../LanguageSubtags/type-aliases/RegistryEntryScope.md) |
| <a id="property-subtag"></a> `Subtag` | `TSUBTAG` \| `TSUBTAG`[] |
| <a id="property-suppress-script"></a> `Suppress-Script?` | [`ScriptSubtag`](../../../../../../LanguageSubtags/type-aliases/ScriptSubtag.md) |
| <a id="property-type"></a> `Type` | `TTYPE` |
