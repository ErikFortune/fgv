[**@fgv Monorepo API Documentation**](../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../../../README.md) / [Iana](../../../../../README.md) / [LanguageSubtags](../../../README.md) / [Model](../README.md) / IRegisteredSubtagWithRange

# Interface: IRegisteredSubtagWithRange\<TTYPE, TTAG\>

## Extends

- [`IRegisteredSubtag`](IRegisteredSubtag.md)\<`TTYPE`, `TTAG`\>

## Extended by

- [`IRegisteredLanguage`](IRegisteredLanguage.md)
- [`IRegisteredScript`](IRegisteredScript.md)
- [`IRegisteredRegion`](IRegisteredRegion.md)

## Type Parameters

| Type Parameter |
| ------ |
| `TTYPE` *extends* [`RegistryEntryType`](../../../type-aliases/RegistryEntryType.md) |
| `TTAG` *extends* `string` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="description"></a> `description` | `readonly` | `string`[] |
| <a id="subtag"></a> `subtag` | `readonly` | `TTAG` |
| <a id="subtagrangeend"></a> `subtagRangeEnd?` | `readonly` | `TTAG` |
| <a id="type"></a> `type` | `readonly` | `TTYPE` |
