[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-bcp47](../../../README.md) / [Bcp47](../README.md) / LanguageSimilarityMatcher

# Class: LanguageSimilarityMatcher

Helper to compare two language tags to determine how closely related they are,
applying normalization and language semantics as appropriate.

## Constructors

### Constructor

> **new LanguageSimilarityMatcher**(`iana?`): `LanguageSimilarityMatcher`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `iana?` | [`LanguageRegistries`](../../Iana/classes/LanguageRegistries.md) |

#### Returns

`LanguageSimilarityMatcher`

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="iana"></a> `iana` | `public` | [`LanguageRegistries`](../../Iana/classes/LanguageRegistries.md) |
| <a id="overrides"></a> `overrides` | `public` | [`OverridesRegistry`](../namespaces/Overrides/classes/OverridesRegistry.md) |
| <a id="unsd"></a> `unsd` | `public` | [`RegionCodes`](../../Unsd/classes/RegionCodes.md) |

## Methods

### matchExtensions()

> **matchExtensions**(`lt1`, `lt2`): `number`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `lt1` | [`LanguageTag`](LanguageTag.md) |
| `lt2` | [`LanguageTag`](LanguageTag.md) |

#### Returns

`number`

***

### matchExtlang()

> **matchExtlang**(`lt1`, `lt2`): `number`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `lt1` | [`LanguageTag`](LanguageTag.md) |
| `lt2` | [`LanguageTag`](LanguageTag.md) |

#### Returns

`number`

***

### matchLanguageTags()

> **matchLanguageTags**(`t1`, `t2`): `number`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `t1` | [`LanguageTag`](LanguageTag.md) |
| `t2` | [`LanguageTag`](LanguageTag.md) |

#### Returns

`number`

***

### matchPrimaryLanguage()

> **matchPrimaryLanguage**(`lt1`, `lt2`): `number`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `lt1` | [`LanguageTag`](LanguageTag.md) |
| `lt2` | [`LanguageTag`](LanguageTag.md) |

#### Returns

`number`

***

### matchPrivateUseTags()

> **matchPrivateUseTags**(`lt1`, `lt2`): `number`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `lt1` | [`LanguageTag`](LanguageTag.md) |
| `lt2` | [`LanguageTag`](LanguageTag.md) |

#### Returns

`number`

***

### matchRegion()

> **matchRegion**(`lt1`, `lt2`): `number`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `lt1` | [`LanguageTag`](LanguageTag.md) |
| `lt2` | [`LanguageTag`](LanguageTag.md) |

#### Returns

`number`

***

### matchScript()

> **matchScript**(`lt1`, `lt2`): `number`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `lt1` | [`LanguageTag`](LanguageTag.md) |
| `lt2` | [`LanguageTag`](LanguageTag.md) |

#### Returns

`number`

***

### matchVariants()

> **matchVariants**(`lt1`, `lt2`): `number`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `lt1` | [`LanguageTag`](LanguageTag.md) |
| `lt2` | [`LanguageTag`](LanguageTag.md) |

#### Returns

`number`
