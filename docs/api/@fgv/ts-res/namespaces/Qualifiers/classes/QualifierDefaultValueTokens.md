[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Qualifiers](../README.md) / QualifierDefaultValueTokens

# Class: QualifierDefaultValueTokens

Helper class to parse and validate qualifier default value tokens.

## Constructors

### Constructor

> **new QualifierDefaultValueTokens**(`qualifiers`): `QualifierDefaultValueTokens`

Constructs a new QualifierDefaultValueTokens instance.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `qualifiers` | [`IReadOnlyQualifierCollector`](../interfaces/IReadOnlyQualifierCollector.md) | the [qualifier collector](../interfaces/IReadOnlyQualifierCollector.md) to use |

#### Returns

`QualifierDefaultValueTokens`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="qualifiers"></a> `qualifiers` | `readonly` | [`IReadOnlyQualifierCollector`](../interfaces/IReadOnlyQualifierCollector.md) | The [qualifier collector](../interfaces/IReadOnlyQualifierCollector.md) used to validate qualifier names and values. |

## Methods

### declToQualifierDefaultValuesToken()

> **declToQualifierDefaultValuesToken**(`decl`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Converts a validated qualifier default values declaration to a [qualifier default values token](../../../type-aliases/QualifierDefaultValuesToken.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `decl` | [`IValidatedQualifierDefaultValuesDecl`](../type-aliases/IValidatedQualifierDefaultValuesDecl.md) | the validated qualifier default values declaration to convert |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

`Success` with the qualifier default values token if successful, `Failure` with an error message if not.

***

### parseQualifierDefaultValuesToken()

> **parseQualifierDefaultValuesToken**(`token`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedQualifierDefaultValueDecl`](../interfaces/IValidatedQualifierDefaultValueDecl.md)[]\>

Parses a [qualifier default values token](../../../type-aliases/QualifierDefaultValuesToken.md) string and validates the parts
against the qualifiers present in the [qualifier collector](#qualifiers).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the token string to parse. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedQualifierDefaultValueDecl`](../interfaces/IValidatedQualifierDefaultValueDecl.md)[]\>

`Success` with the array of [validated qualifier default value declarations](../interfaces/IValidatedQualifierDefaultValueDecl.md)
if successful, `Failure` with an error message if not.

***

### parseQualifierDefaultValueToken()

> **parseQualifierDefaultValueToken**(`token`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedQualifierDefaultValueDecl`](../interfaces/IValidatedQualifierDefaultValueDecl.md)\>

Parses a [qualifier default value token](../../../type-aliases/QualifierDefaultValueToken.md) string and validates the parts
against the qualifiers present in the [qualifier collector](#qualifiers).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the token string to parse. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedQualifierDefaultValueDecl`](../interfaces/IValidatedQualifierDefaultValueDecl.md)\>

`Success` with the [validated qualifier default value declaration](../interfaces/IValidatedQualifierDefaultValueDecl.md)
if successful, `Failure` with an error message if not.

***

### qualifierDefaultValuesTokenToDecl()

> **qualifierDefaultValuesTokenToDecl**(`token`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedQualifierDefaultValuesDecl`](../type-aliases/IValidatedQualifierDefaultValuesDecl.md)\>

Converts a [qualifier default values token](../../../type-aliases/QualifierDefaultValuesToken.md) to a validated qualifier default values declaration.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the qualifier default values token to convert |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedQualifierDefaultValuesDecl`](../type-aliases/IValidatedQualifierDefaultValuesDecl.md)\>

`Success` with the validated qualifier default values declaration if successful, `Failure` with an error message if not.

***

### validateQualifierDefaultValueTokenParts()

> **validateQualifierDefaultValueTokenParts**(`parts`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedQualifierDefaultValueDecl`](../interfaces/IValidatedQualifierDefaultValueDecl.md)\>

Validates the [parts](../../Helpers/interfaces/IQualifierDefaultValueTokenParts.md) of a [qualifier default value token](../../../type-aliases/QualifierDefaultValueToken.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `parts` | [`IQualifierDefaultValueTokenParts`](../../Helpers/interfaces/IQualifierDefaultValueTokenParts.md) | the parts to validate |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedQualifierDefaultValueDecl`](../interfaces/IValidatedQualifierDefaultValueDecl.md)\>

`Success` with the validated declaration if successful, `Failure` with an error message if not.

***

### declToQualifierDefaultValuesToken()

> `static` **declToQualifierDefaultValuesToken**(`decl`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Converts a validated qualifier default values declaration to a [qualifier default values token](../../../type-aliases/QualifierDefaultValuesToken.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `decl` | [`IValidatedQualifierDefaultValuesDecl`](../type-aliases/IValidatedQualifierDefaultValuesDecl.md) | the validated qualifier default values declaration to convert |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

`Success` with the qualifier default values token if successful, `Failure` with an error message if not.

***

### parseQualifierDefaultValuesToken()

> `static` **parseQualifierDefaultValuesToken**(`token`, `qualifiers`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedQualifierDefaultValueDecl`](../interfaces/IValidatedQualifierDefaultValueDecl.md)[]\>

Parses a [qualifier default values token](../../../type-aliases/QualifierDefaultValuesToken.md) and validates it against the qualifiers
present in the supplied [qualifier collector](../interfaces/IReadOnlyQualifierCollector.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the token string to parse. |
| `qualifiers` | [`IReadOnlyQualifierCollector`](../interfaces/IReadOnlyQualifierCollector.md) | the [qualifier collector](../interfaces/IReadOnlyQualifierCollector.md) to use |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedQualifierDefaultValueDecl`](../interfaces/IValidatedQualifierDefaultValueDecl.md)[]\>

`Success` with an array of [validated qualifier default value declarations](../interfaces/IValidatedQualifierDefaultValueDecl.md)
if successful, `Failure` with an error message if not

***

### parseQualifierDefaultValueToken()

> `static` **parseQualifierDefaultValueToken**(`token`, `qualifiers`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedQualifierDefaultValueDecl`](../interfaces/IValidatedQualifierDefaultValueDecl.md)\>

Parses a [qualifier default value token](../../../type-aliases/QualifierDefaultValueToken.md) and validates it against the qualifiers
present in the supplied [qualifier collector](../interfaces/IReadOnlyQualifierCollector.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the token string to parse. |
| `qualifiers` | [`IReadOnlyQualifierCollector`](../interfaces/IReadOnlyQualifierCollector.md) | the [qualifier collector](../interfaces/IReadOnlyQualifierCollector.md) to use |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedQualifierDefaultValueDecl`](../interfaces/IValidatedQualifierDefaultValueDecl.md)\>

`Success` with a [validated qualifier default value declaration](../interfaces/IValidatedQualifierDefaultValueDecl.md) if successful,
`Failure` with an error message if not.

***

### qualifierDefaultValuesTokenToDecl()

> `static` **qualifierDefaultValuesTokenToDecl**(`token`, `qualifiers`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedQualifierDefaultValuesDecl`](../type-aliases/IValidatedQualifierDefaultValuesDecl.md)\>

Converts a [qualifier default values token](../../../type-aliases/QualifierDefaultValuesToken.md) to a validated qualifier default values declaration.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `token` | `string` | the qualifier default values token to convert |
| `qualifiers` | [`IReadOnlyQualifierCollector`](../interfaces/IReadOnlyQualifierCollector.md) | the [qualifier collector](../interfaces/IReadOnlyQualifierCollector.md) to use |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedQualifierDefaultValuesDecl`](../type-aliases/IValidatedQualifierDefaultValuesDecl.md)\>

`Success` with the validated qualifier default values declaration if successful, `Failure` with an error message if not.

***

### validateQualifierDefaultValueTokenParts()

> `static` **validateQualifierDefaultValueTokenParts**(`parts`, `qualifiers`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedQualifierDefaultValueDecl`](../interfaces/IValidatedQualifierDefaultValueDecl.md)\>

Validates the parts of a qualifier default value token against the qualifiers present in the supplied
[qualifier collector](../interfaces/IReadOnlyQualifierCollector.md).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `parts` | [`IQualifierDefaultValueTokenParts`](../../Helpers/interfaces/IQualifierDefaultValueTokenParts.md) | the [qualifier default value token parts](../../Helpers/interfaces/IQualifierDefaultValueTokenParts.md) to validate. |
| `qualifiers` | [`IReadOnlyQualifierCollector`](../interfaces/IReadOnlyQualifierCollector.md) | the [qualifier collector](../interfaces/IReadOnlyQualifierCollector.md) used to validate qualifier names and values. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IValidatedQualifierDefaultValueDecl`](../interfaces/IValidatedQualifierDefaultValueDecl.md)\>

`Success` with a [validated qualifier default value declaration](../interfaces/IValidatedQualifierDefaultValueDecl.md) if successful,
`Failure` with an error message if not.
