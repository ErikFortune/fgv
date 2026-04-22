[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-bcp47](../../../README.md) / [Bcp47](../README.md) / ILanguageTagInitOptions

# Interface: ILanguageTagInitOptions

Initialization options for parsing or creation of [language tag](../classes/LanguageTag.md) objects.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="iana"></a> `iana?` | [`LanguageRegistries`](../../Iana/classes/LanguageRegistries.md) | The [IANA language subtag and extension registries](../../Iana/classes/LanguageRegistries.md) to be used for the request (optional). |
| <a id="normalization"></a> `normalization?` | [`TagNormalization`](../type-aliases/TagNormalization.md) | Desired [normalization level](../type-aliases/TagNormalization.md) (optional). |
| <a id="validity"></a> `validity?` | [`TagValidity`](../type-aliases/TagValidity.md) | Desired [validity level](../type-aliases/TagValidity.md) (optional). |
