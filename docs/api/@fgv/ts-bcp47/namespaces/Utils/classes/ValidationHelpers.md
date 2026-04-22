[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-bcp47](../../../README.md) / [Utils](../README.md) / ValidationHelpers

# Class: ValidationHelpers\<T, TC\>

A collection of validation and normalization helpers for constrained string
types.
*

## Extended by

- [`TagValidationHelpers`](../../Iana/namespaces/Jar/namespaces/LanguageSubtags/namespaces/Tags/namespaces/Helpers/classes/TagValidationHelpers.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* `string` | - |
| `TC` | `unknown` |

## Constructors

### Constructor

> **new ValidationHelpers**\<`T`, `TC`\>(`init`): `ValidationHelpers`\<`T`, `TC`\>

Constructs new validation helpers
from supplied initializers.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `init` | [`ValidationHelpersConstructorParams`](../interfaces/ValidationHelpersConstructorParams.md)\<`T`, `TC`\> | The [constructor params](../interfaces/ValidationHelpersConstructorParams.md) used to initialize this validation helpers. |

#### Returns

`ValidationHelpers`\<`T`, `TC`\>

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="_tocanonical"></a> `_toCanonical?` | `readonly` | [`Normalizer`](../type-aliases/Normalizer.md)\<`T`, `TC`\> | **`Internal`** |
| <a id="converter"></a> `converter` | `readonly` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> | A `Converter` which converts `unknown` to the tag type validated by these helpers, if possible. |
| <a id="description"></a> `description` | `readonly` | `string` | Describes the group of tags validated by these helpers. |
| <a id="iscanonical"></a> `isCanonical` | `readonly` | [`TypeGuardWithContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> | Determines is a supplied tag is well-formed and uses canonical formatting, according to the lexical rules defined for the tag validated by these helpers. |
| <a id="iswellformed"></a> `isWellFormed` | `readonly` | [`TypeGuardWithContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `TC`\> | Determines is a supplied tag is well-formed according to the lexical rules defined for the tag validated by these helpers. |

## Methods

### toCanonical()

> **toCanonical**(`from`, `context?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

Converts a supplied `unknown` to the canonical form of the tag
validated by these helpers.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` to be converted. |
| `context?` | `TC` | Optional context used in the conversion. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

`Success` with the corresponding canonical value,
or `Failure` with details if an error occurs.

***

### verifyIsCanonical()

> **verifyIsCanonical**(`from`, `context?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

Determines if a supplied `unknown` is a well-formed, canonical representation
of the tag validated by these helpers.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` to be validated. |
| `context?` | `TC` | Optional context used in the validation. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

`Success` with the validated canonical value, or `Failure` with
details if an error occurs.

***

### verifyIsWellFormed()

> **verifyIsWellFormed**(`from`, `context?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

Determines if a supplied `unknown` is a well-formed representation
of the tag validated by these helpers.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | `unknown` | The `unknown` to be validated. |
| `context?` | `TC` | Optional context used in the validation. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

`Success` with the validated value, or `Failure` with details
if an error occurs.
