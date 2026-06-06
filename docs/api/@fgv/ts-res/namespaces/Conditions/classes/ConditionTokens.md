[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Conditions](../README.md) / ConditionTokens

# Class: ConditionTokens

Helper class to parse and validate condition tokens.

## Constructors

### Constructor

> **new ConditionTokens**(`qualifiers`): `ConditionTokens`

Constructs a new ConditionTokens instance.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `qualifiers` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | the [qualifier collector](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) to use |

#### Returns

`ConditionTokens`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="qualifiers"></a> `qualifiers` | `readonly` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | The [qualifier collector](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) used to validate qualifier names and values. |

## Methods

### findQualifierForValue()

> **findQualifierForValue**(`value`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Qualifier`](../../../classes/Qualifier.md)\>

Given a value, finds a single token-optional qualifier that matches the value.
Fails if no qualifiers match, or if more than one qualifier matches.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `string` | the value to match. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Qualifier`](../../../classes/Qualifier.md)\>

`Success` with the matching qualifier if successful, `Failure` with an error message if not.

***

### parseConditionSetToken()

> **parseConditionSetToken**(`token`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedConditionDecl`](../interfaces/IValidatedConditionDecl.md)[]\>

Parses a [condition set token](../../../type-aliases/ConditionSetToken.md) string and validates the parts
against the qualifiers present in the [qualifier collector](#qualifiers).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the token string to parse. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedConditionDecl`](../interfaces/IValidatedConditionDecl.md)[]\>

`Success` with the array of [validated condition declarations](../interfaces/IValidatedConditionDecl.md)
if successful, `Failure` with an error message if not.

***

### parseConditionToken()

> **parseConditionToken**(`token`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedConditionDecl`](../interfaces/IValidatedConditionDecl.md)\>

i
Parses a [condition token](../../../type-aliases/ConditionToken.md) string and validates the parts
against the qualifiers present in the [qualifier collector](#qualifiers).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the token string to parse. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedConditionDecl`](../interfaces/IValidatedConditionDecl.md)\>

`Success` with the [validated condition declaration](../interfaces/IValidatedConditionDecl.md)
if successful, `Failure` with an error message if not.

***

### validateConditionTokenParts()

> **validateConditionTokenParts**(`parts`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedConditionDecl`](../interfaces/IValidatedConditionDecl.md)\>

Validates the [parts](../../Helpers/interfaces/IConditionTokenParts.md) of a [condition token](../../../type-aliases/ConditionToken.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `parts` | [`IConditionTokenParts`](../../Helpers/interfaces/IConditionTokenParts.md) | the parts to validate |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedConditionDecl`](../interfaces/IValidatedConditionDecl.md)\>

`Success` with the validated declaration if successful, `Failure` with an error message if not.

***

### findQualifierForValue()

> `static` **findQualifierForValue**(`value`, `qualifiers`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Qualifier`](../../../classes/Qualifier.md)\>

Given a value and a set of qualifiers, finds a single token-optional qualifier that matches the value.
Fails if no qualifiers match, or if more than one qualifier matches.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `string` | the value to match. |
| `qualifiers` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | the qualifiers to match against. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Qualifier`](../../../classes/Qualifier.md)\>

`Success` with the matching qualifier if successful, `Failure` with an error message if not.

***

### parseConditionSetToken()

> `static` **parseConditionSetToken**(`token`, `qualifiers`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedConditionDecl`](../interfaces/IValidatedConditionDecl.md)[]\>

Parses a [condition set token](../../../type-aliases/ConditionSetToken.md) and validates it against the qualifiers
present in the supplied [qualifier collector](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the token string to parse. |
| `qualifiers` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | the [qualifier collector](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) to use |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedConditionDecl`](../interfaces/IValidatedConditionDecl.md)[]\>

`Success` with an array of [validated condition declarations](../interfaces/IValidatedConditionDecl.md)
if successful, `Failure` with an error message if not

***

### parseConditionToken()

> `static` **parseConditionToken**(`token`, `qualifiers`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedConditionDecl`](../interfaces/IValidatedConditionDecl.md)\>

Parses a [condition token](../../../type-aliases/ConditionToken.md) and validates it against the qualifiers
present in the supplied [qualifier collector](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the token string to parse. |
| `qualifiers` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | the [qualifier collector](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) to use |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedConditionDecl`](../interfaces/IValidatedConditionDecl.md)\>

`Success` with a [validated condition declaration](../interfaces/IValidatedConditionDecl.md) if successful,
`Failure` with an error message if not.

***

### validateConditionTokenParts()

> `static` **validateConditionTokenParts**(`parts`, `qualifiers`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedConditionDecl`](../interfaces/IValidatedConditionDecl.md)\>

Validates the parts of a condition token against the qualifiers present in the supplied
[qualifier collector](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `parts` | [`IConditionTokenParts`](../../Helpers/interfaces/IConditionTokenParts.md) | the [condition token parts](../../Helpers/interfaces/IConditionTokenParts.md) to validate. |
| `qualifiers` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | the [qualifier collector](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) used to validate qualifier names and values. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedConditionDecl`](../interfaces/IValidatedConditionDecl.md)\>

`Success` with a [validated condition declaration](../interfaces/IValidatedConditionDecl.md) if successful,
`Failure` with an error message if not.
