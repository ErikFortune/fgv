[**@fgv Monorepo API Documentation**](../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../../../README.md) / [Iana](../../../../../README.md) / [LanguageSubtags](../../../README.md) / [Model](../README.md) / IRegisteredSubtag

# Interface: IRegisteredSubtag\<TTYPE, TTAG\>

## Extended by

- [`IRegisteredSubtagWithRange`](IRegisteredSubtagWithRange.md)
- [`IRegisteredExtLang`](IRegisteredExtLang.md)
- [`IRegisteredVariant`](IRegisteredVariant.md)

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-ttype"></a> `TTYPE` *extends* [`RegistryEntryType`](../../../type-aliases/RegistryEntryType.md) |
| <a id="type-parameter-ttag"></a> `TTAG` *extends* `string` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-description"></a> `description` | `readonly` | `string`[] |
| <a id="property-subtag"></a> `subtag` | `readonly` | `TTAG` |
| <a id="property-type"></a> `type` | `readonly` | `TTYPE` |
