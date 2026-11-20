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
| <a id="property-_all"></a> `_all` | `protected readonly` | [`RegisteredItem`](../namespaces/Model/type-aliases/RegisteredItem.md)[] | **`Internal`** |
| <a id="property-collections"></a> `collections` | `public readonly` | [`LanguageSubtagScope`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | - |
| <a id="property-extlangs"></a> `extlangs` | `public readonly` | [`ExtLangSubtagScope`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | - |
| <a id="property-filedate"></a> `fileDate` | `public readonly` | [`YearMonthDaySpec`](../../Jar/namespaces/LanguageSubtags/namespaces/Registry/type-aliases/YearMonthDaySpec.md) | - |
| <a id="property-grandfathered"></a> `grandfathered` | `public readonly` | [`GrandfatheredTagScope`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | - |
| <a id="property-languages"></a> `languages` | `public readonly` | [`LanguageSubtagScope`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | - |
| <a id="property-macrolanguages"></a> `macrolanguages` | `public readonly` | [`LanguageSubtagScope`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | - |
| <a id="property-privateuse"></a> `privateUse` | `public readonly` | [`LanguageSubtagScope`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | - |
| <a id="property-redundant"></a> `redundant` | `public readonly` | [`RedundantTagScope`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | - |
| <a id="property-regions"></a> `regions` | `public readonly` | [`RegionSubtagScope`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | - |
| <a id="property-scripts"></a> `scripts` | `public readonly` | [`ScriptSubtagScope`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | - |
| <a id="property-special"></a> `special` | `public readonly` | [`LanguageSubtagScope`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | - |
| <a id="property-variants"></a> `variants` | `public readonly` | [`VariantSubtagScope`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | - |

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
