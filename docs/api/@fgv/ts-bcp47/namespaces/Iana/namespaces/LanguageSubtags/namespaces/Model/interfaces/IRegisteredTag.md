[**@fgv Monorepo API Documentation**](../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../../../README.md) / [Iana](../../../../../README.md) / [LanguageSubtags](../../../README.md) / [Model](../README.md) / IRegisteredTag

# Interface: IRegisteredTag\<TTYPE, TTAG\>

## Extended by

- [`IRegisteredGrandfatheredTag`](IRegisteredGrandfatheredTag.md)
- [`IRegisteredRedundantTag`](IRegisteredRedundantTag.md)

## Type Parameters

| Type Parameter |
| ------ |
| `TTYPE` *extends* [`RegistryEntryType`](../../../type-aliases/RegistryEntryType.md) |
| `TTAG` *extends* `string` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="description"></a> `description` | `readonly` | `string`[] |
| <a id="tag"></a> `tag` | `readonly` | `TTAG` |
| <a id="type"></a> `type` | `readonly` | `TTYPE` |
