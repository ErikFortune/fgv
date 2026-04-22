[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../README.md) / [Iana](../../../README.md) / [LanguageTagExtensions](../README.md) / LanguageTagExtensionRegistry

# Class: LanguageTagExtensionRegistry

## Constructors

### Constructor

> `protected` **new LanguageTagExtensionRegistry**(`registry`): `LanguageTagExtensionRegistry`

**`Internal`**

Constructs an Iana.LanguageTagExtensions.LanguageTagExtensionRegistry.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `registry` | [`LanguageTagExtensions`](../namespaces/Model/type-aliases/LanguageTagExtensions.md) | Registry file from which the registry is to be constructed. |

#### Returns

`LanguageTagExtensionRegistry`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_all"></a> `_all` | `readonly` | [`ILanguageTagExtension`](../namespaces/Model/interfaces/ILanguageTagExtension.md)[] | **`Internal`** |
| <a id="extensions"></a> `extensions` | `readonly` | [`TagExtensionsScope`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47/docs) | - |
| <a id="filedate"></a> `fileDate` | `readonly` | [`YearMonthDaySpec`](../../Model/type-aliases/YearMonthDaySpec.md) | - |

## Methods

### create()

> `static` **create**(`registry`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTagExtensionRegistry`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `registry` | [`LanguageTagExtensions`](../namespaces/Model/type-aliases/LanguageTagExtensions.md) |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTagExtensionRegistry`\>

***

### createFromJson()

> `static` **createFromJson**(`from`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTagExtensionRegistry`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `from` | `unknown` |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTagExtensionRegistry`\>

***

### createFromTxtContent()

> `static` **createFromTxtContent**(`content`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTagExtensionRegistry`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `content` | `string` |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTagExtensionRegistry`\>

***

### loadDefault()

> `static` **loadDefault**(): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTagExtensionRegistry`\>

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`LanguageTagExtensionRegistry`\>
