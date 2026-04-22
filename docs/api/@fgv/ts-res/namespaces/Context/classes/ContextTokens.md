[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Context](../README.md) / ContextTokens

# Class: ContextTokens

Helper class to parse and validate context tokens.

## Constructors

### Constructor

> **new ContextTokens**(`qualifiers`): `ContextTokens`

Constructs a new ContextTokens instance.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `qualifiers` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | the [qualifier collector](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) to use |

#### Returns

`ContextTokens`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="qualifiers"></a> `qualifiers` | `readonly` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | The [qualifier collector](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) used to validate qualifier names and values. |

## Methods

### contextTokenToPartialContext()

> **contextTokenToPartialContext**(`token`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedContextDecl`](../type-aliases/IValidatedContextDecl.md)\>

Converts a [context token](../../../type-aliases/ContextToken.md) to a validated partial context.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the context token to convert |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedContextDecl`](../type-aliases/IValidatedContextDecl.md)\>

`Success` with the validated partial context if successful, `Failure` with an error message if not.

***

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

### parseContextQualifierToken()

> **parseContextQualifierToken**(`token`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedContextQualifierValueDecl`](../interfaces/IValidatedContextQualifierValueDecl.md)\>

Parses a [context qualifier token](../../../type-aliases/ContextQualifierToken.md) string and validates the parts
against the qualifiers present in the [qualifier collector](#qualifiers).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the token string to parse. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedContextQualifierValueDecl`](../interfaces/IValidatedContextQualifierValueDecl.md)\>

`Success` with the [validated context qualifier value declaration](../interfaces/IValidatedContextQualifierValueDecl.md)
if successful, `Failure` with an error message if not.

***

### parseContextToken()

> **parseContextToken**(`token`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedContextQualifierValueDecl`](../interfaces/IValidatedContextQualifierValueDecl.md)[]\>

Parses a [context token](../../../type-aliases/ContextToken.md) string and validates the parts
against the qualifiers present in the [qualifier collector](#qualifiers).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the token string to parse. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedContextQualifierValueDecl`](../interfaces/IValidatedContextQualifierValueDecl.md)[]\>

`Success` with the array of [validated context qualifier value declarations](../interfaces/IValidatedContextQualifierValueDecl.md)
if successful, `Failure` with an error message if not.

***

### partialContextToContextToken()

> **partialContextToContextToken**(`context`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Converts a validated partial context to a [context token](../../../type-aliases/ContextToken.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | [`IValidatedContextDecl`](../type-aliases/IValidatedContextDecl.md) | the validated partial context to convert |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

`Success` with the context token if successful, `Failure` with an error message if not.

***

### validateContextTokenParts()

> **validateContextTokenParts**(`parts`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedContextQualifierValueDecl`](../interfaces/IValidatedContextQualifierValueDecl.md)\>

Validates the [parts](../../Helpers/interfaces/IContextTokenParts.md) of a [context token](../../../type-aliases/ContextToken.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `parts` | [`IContextTokenParts`](../../Helpers/interfaces/IContextTokenParts.md) | the parts to validate |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedContextQualifierValueDecl`](../interfaces/IValidatedContextQualifierValueDecl.md)\>

`Success` with the validated declaration if successful, `Failure` with an error message if not.

***

### contextTokenToPartialContext()

> `static` **contextTokenToPartialContext**(`token`, `qualifiers`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedContextDecl`](../type-aliases/IValidatedContextDecl.md)\>

Converts a [context token](../../../type-aliases/ContextToken.md) to a validated partial context.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the context token to convert |
| `qualifiers` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | the [qualifier collector](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) to use |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedContextDecl`](../type-aliases/IValidatedContextDecl.md)\>

`Success` with the validated partial context if successful, `Failure` with an error message if not.

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

### parseContextQualifierToken()

> `static` **parseContextQualifierToken**(`token`, `qualifiers`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedContextQualifierValueDecl`](../interfaces/IValidatedContextQualifierValueDecl.md)\>

Parses a [context qualifier token](../../../type-aliases/ContextQualifierToken.md) and validates it against the qualifiers
present in the supplied [qualifier collector](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the token string to parse. |
| `qualifiers` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | the [qualifier collector](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) to use |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedContextQualifierValueDecl`](../interfaces/IValidatedContextQualifierValueDecl.md)\>

`Success` with a [validated context qualifier value declaration](../interfaces/IValidatedContextQualifierValueDecl.md) if successful,
`Failure` with an error message if not.

***

### parseContextToken()

> `static` **parseContextToken**(`token`, `qualifiers`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedContextQualifierValueDecl`](../interfaces/IValidatedContextQualifierValueDecl.md)[]\>

Parses a [context token](../../../type-aliases/ContextToken.md) and validates it against the qualifiers
present in the supplied [qualifier collector](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the token string to parse. |
| `qualifiers` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | the [qualifier collector](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) to use |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedContextQualifierValueDecl`](../interfaces/IValidatedContextQualifierValueDecl.md)[]\>

`Success` with an array of [validated context qualifier value declarations](../interfaces/IValidatedContextQualifierValueDecl.md)
if successful, `Failure` with an error message if not

***

### partialContextToContextToken()

> `static` **partialContextToContextToken**(`context`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Converts a validated partial context to a [context token](../../../type-aliases/ContextToken.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `context` | [`IValidatedContextDecl`](../type-aliases/IValidatedContextDecl.md) | the validated partial context to convert |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

`Success` with the context token if successful, `Failure` with an error message if not.

***

### validateContextTokenParts()

> `static` **validateContextTokenParts**(`parts`, `qualifiers`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedContextQualifierValueDecl`](../interfaces/IValidatedContextQualifierValueDecl.md)\>

Validates the parts of a context token against the qualifiers present in the supplied
[qualifier collector](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `parts` | [`IContextTokenParts`](../../Helpers/interfaces/IContextTokenParts.md) | the [context token parts](../../Helpers/interfaces/IContextTokenParts.md) to validate. |
| `qualifiers` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | the [qualifier collector](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) used to validate qualifier names and values. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedContextQualifierValueDecl`](../interfaces/IValidatedContextQualifierValueDecl.md)\>

`Success` with a [validated context qualifier value declaration](../interfaces/IValidatedContextQualifierValueDecl.md) if successful,
`Failure` with an error message if not.
