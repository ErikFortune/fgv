[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../README.md) / [Iana](../../../README.md) / [LanguageSubtags](../README.md) / LanguageSubtagRegistry

# Class: LanguageSubtagRegistry

## Constructors

### Constructor

> `protected` **new LanguageSubtagRegistry**(`registry`): `LanguageSubtagRegistry`

**`Internal`**

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `registry` | [`RegistryFile`](../namespaces/Model/type-aliases/RegistryFile.md) | The contents of the registry file from which the data is loaded. |

#### Returns

`LanguageSubtagRegistry`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_all"></a> `_all` | `readonly` | [`RegisteredItem`](../namespaces/Model/type-aliases/RegisteredItem.md)[] | **`Internal`** |
| <a id="collections"></a> `collections` | `readonly` | [`LanguageSubtagScope`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | - |
| <a id="extlangs"></a> `extlangs` | `readonly` | [`ExtLangSubtagScope`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | - |
| <a id="filedate"></a> `fileDate` | `readonly` | [`YearMonthDaySpec`](../../Jar/namespaces/LanguageSubtags/namespaces/Registry/type-aliases/YearMonthDaySpec.md) | - |
| <a id="grandfathered"></a> `grandfathered` | `readonly` | [`GrandfatheredTagScope`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | - |
| <a id="languages"></a> `languages` | `readonly` | [`LanguageSubtagScope`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | - |
| <a id="macrolanguages"></a> `macrolanguages` | `readonly` | [`LanguageSubtagScope`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | - |
| <a id="privateuse"></a> `privateUse` | `readonly` | [`LanguageSubtagScope`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | - |
| <a id="redundant"></a> `redundant` | `readonly` | [`RedundantTagScope`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | - |
| <a id="regions"></a> `regions` | `readonly` | [`RegionSubtagScope`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | - |
| <a id="scripts"></a> `scripts` | `readonly` | [`ScriptSubtagScope`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | - |
| <a id="special"></a> `special` | `readonly` | [`LanguageSubtagScope`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | - |
| <a id="variants"></a> `variants` | `readonly` | [`VariantSubtagScope`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | - |

## Methods

### create()

> `static` **create**(`registry`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageSubtagRegistry`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `registry` | [`RegistryFile`](../namespaces/Model/type-aliases/RegistryFile.md) |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageSubtagRegistry`\>

***

### createFromJson()

> `static` **createFromJson**(`from`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageSubtagRegistry`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | `unknown` |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageSubtagRegistry`\>

***

### createFromTxtContent()

> `static` **createFromTxtContent**(`content`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageSubtagRegistry`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `content` | `string` |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageSubtagRegistry`\>

***

### loadDefault()

> `static` **loadDefault**(): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageSubtagRegistry`\>

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageSubtagRegistry`\>
