[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../README.md) / [Bcp47](../../../README.md) / [Overrides](../README.md) / OverridesRegistry

# Class: OverridesRegistry

## Constructors

### Constructor

> `protected` **new OverridesRegistry**(): `OverridesRegistry`

#### Returns

`OverridesRegistry`

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="overrides"></a> `overrides` | `readonly` | `Map`\<[`LanguageSubtag`](../../../../Iana/namespaces/LanguageSubtags/type-aliases/LanguageSubtag.md), [`ILanguageOverride`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs)\> |

## Methods

### \_overrideFromRecord()

> `protected` `static` **\_overrideFromRecord**(`record`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ILanguageOverride`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs)\>

**`Internal`**

Converts a file Bcp47.Overrides.Model.LanguageOverrideRecord \| LanguageOverrideRecord
to a runtime Bcp47.Overrides.LanguageOverride \| LanguageOverride.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `record` | [`ILanguageOverrideRecord`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | The Bcp47.Overrides.Model.LanguageOverrideRecord \| LanguageOverrideRecord to be converted. |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ILanguageOverride`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs)\>

`Success` with the resulting Bcp47.Overrides.LanguageOverride \| LanguageOverride
or `Error` with details if an error occurs.

***

### create()

> `static` **create**(`overrides`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`OverridesRegistry`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `overrides` | [`ILanguageOverride`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs)[] |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`OverridesRegistry`\>

***

### createFromJson()

> `static` **createFromJson**(`from`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`OverridesRegistry`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | `unknown` |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`OverridesRegistry`\>

***

### loadDefault()

> `static` **loadDefault**(): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`OverridesRegistry`\>

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`OverridesRegistry`\>

***

### loadJson()

> `static` **loadJson**(`path`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`OverridesRegistry`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `path` | `string` |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`OverridesRegistry`\>
