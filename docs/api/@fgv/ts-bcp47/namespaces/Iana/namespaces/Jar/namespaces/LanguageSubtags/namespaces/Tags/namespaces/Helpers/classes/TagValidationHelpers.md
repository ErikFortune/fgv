[**@fgv Monorepo API Documentation**](../../../../../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../../../../../README.md) / [@fgv/ts-bcp47](../../../../../../../../../../../README.md) / [Iana](../../../../../../../../../README.md) / [Jar](../../../../../../../README.md) / [LanguageSubtags](../../../../../README.md) / [Tags](../../../README.md) / [Helpers](../README.md) / TagValidationHelpers

# Class: TagValidationHelpers\<T, TC\>

**`Internal`**

## Extends

- [`ValidationHelpers`](../../../../../../../../../../Utils/classes/ValidationHelpers.md)\<`T`, `TC`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-t"></a> `T` *extends* `string` | - |
| <a id="type-parameter-tc"></a> `TC` | `unknown` |

## Constructors

### Constructor

> **new TagValidationHelpers**\<`T`, `TC`\>(`description`): `TagValidationHelpers`\<`T`, `TC`\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `description` | `string` |

#### Returns

`TagValidationHelpers`\<`T`, `TC`\>

#### Overrides

[`ValidationHelpers`](../../../../../../../../../../Utils/classes/ValidationHelpers.md).[`constructor`](../../../../../../../../../../Utils/classes/ValidationHelpers.md#constructor)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-_tocanonical"></a> `_toCanonical?` | `protected readonly` | [`Normalizer`](../../../../../../../../../../Utils/type-aliases/Normalizer.md)\<`T`, `TC`\> | **`Internal`** |
| <a id="property-converter"></a> `converter` | `public readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> | A `Converter` which converts `unknown` to the tag type validated by these helpers, if possible. |
| <a id="property-description"></a> `description` | `public readonly` | `string` | Describes the group of tags validated by these helpers. |
| <a id="property-iscanonical"></a> `isCanonical` | `public readonly` | [`TypeGuardWithContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> | Determines is a supplied tag is well-formed and uses canonical formatting, according to the lexical rules defined for the tag validated by these helpers. |
| <a id="property-iswellformed"></a> `isWellFormed` | `public readonly` | [`TypeGuardWithContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> | Determines is a supplied tag is well-formed according to the lexical rules defined for the tag validated by these helpers. |
| <a id="property-wellformed"></a> `wellFormed` | `public readonly` | `RegExp` | - |

## Methods

### toCanonical()

> **toCanonical**(`from`, `context?`): [`Result`](../../../../../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

Converts a supplied `unknown` to the canonical form of the tag
validated by these helpers.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` to be converted. |
| `context?` | `TC` | Optional context used in the conversion. |

#### Returns

[`Result`](../../../../../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

`Success` with the corresponding canonical value,
or `Failure` with details if an error occurs.

#### Inherited from

[`ValidationHelpers`](../../../../../../../../../../Utils/classes/ValidationHelpers.md).[`toCanonical`](../../../../../../../../../../Utils/classes/ValidationHelpers.md#tocanonical)

***

### verifyIsCanonical()

> **verifyIsCanonical**(`from`, `context?`): [`Result`](../../../../../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

Determines if a supplied `unknown` is a well-formed, canonical representation
of the tag validated by these helpers.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` to be validated. |
| `context?` | `TC` | Optional context used in the validation. |

#### Returns

[`Result`](../../../../../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

`Success` with the validated canonical value, or `Failure` with
details if an error occurs.

#### Inherited from

[`ValidationHelpers`](../../../../../../../../../../Utils/classes/ValidationHelpers.md).[`verifyIsCanonical`](../../../../../../../../../../Utils/classes/ValidationHelpers.md#verifyiscanonical)

***

### verifyIsWellFormed()

> **verifyIsWellFormed**(`from`, `context?`): [`Result`](../../../../../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

Determines if a supplied `unknown` is a well-formed representation
of the tag validated by these helpers.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` to be validated. |
| `context?` | `TC` | Optional context used in the validation. |

#### Returns

[`Result`](../../../../../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

`Success` with the validated value, or `Failure` with details
if an error occurs.

#### Inherited from

[`ValidationHelpers`](../../../../../../../../../../Utils/classes/ValidationHelpers.md).[`verifyIsWellFormed`](../../../../../../../../../../Utils/classes/ValidationHelpers.md#verifyiswellformed)

***

### toCanonicalTag()

> `static` **toCanonicalTag**\<`T`\>(`val`): [`Result`](../../../../../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t-1"></a> `T` *extends* `string` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `val` | `T` |

#### Returns

[`Result`](../../../../../../../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>
