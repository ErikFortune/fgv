[**@fgv Monorepo API Documentation**](../../../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../../../../../README.md) / [Iana](../../../../../../../README.md) / [Jar](../../../../../README.md) / [LanguageSubtags](../../../README.md) / [Registry](../README.md) / IRegistryTagEntry

# Interface: IRegistryTagEntry\<TTYPE, TTAG\>

**`Internal`**

## Extends

- [`IRegistryEntryBase`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs)\<`TTYPE`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TTYPE` *extends* [`RegistryEntryType`](../../../../../../LanguageSubtags/type-aliases/RegistryEntryType.md) | [`RegistryEntryType`](../../../../../../LanguageSubtags/type-aliases/RegistryEntryType.md) |
| `TTAG` *extends* `string` | `string` |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="added"></a> `Added` | [`YearMonthDaySpec`](../type-aliases/YearMonthDaySpec.md) |
| <a id="comments"></a> `Comments?` | `string`[] |
| <a id="deprecated"></a> `Deprecated?` | [`YearMonthDaySpec`](../type-aliases/YearMonthDaySpec.md) |
| <a id="description"></a> `Description` | `string`[] |
| <a id="macrolanguage"></a> `Macrolanguage?` | [`LanguageSubtag`](../../../../../../LanguageSubtags/type-aliases/LanguageSubtag.md) |
| <a id="preferred-value"></a> `Preferred-Value?` | `string` |
| <a id="prefix"></a> `Prefix?` | `string`[] |
| <a id="scope"></a> `Scope?` | [`RegistryEntryScope`](../../../../../../LanguageSubtags/type-aliases/RegistryEntryScope.md) |
| <a id="suppress-script"></a> `Suppress-Script?` | [`ScriptSubtag`](../../../../../../LanguageSubtags/type-aliases/ScriptSubtag.md) |
| <a id="tag"></a> `Tag` | `TTAG` \| `TTAG`[] |
| <a id="type"></a> `Type` | `TTYPE` |
