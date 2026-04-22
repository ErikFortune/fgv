[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Runtime](../../../README.md) / [Context](../README.md) / ReadOnlyContextQualifierProviderValidator

# Class: ReadOnlyContextQualifierProviderValidator\<T\>

A validator for read-only context qualifier providers that accepts string inputs
and converts them to strongly-typed values before calling the wrapped provider.
Only provides read operations for compile-time type safety.

## Extends

- [`BaseContextQualifierProviderValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\<`T`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* [`IReadOnlyContextQualifierProvider`](../interfaces/IReadOnlyContextQualifierProvider.md) | [`IReadOnlyContextQualifierProvider`](../interfaces/IReadOnlyContextQualifierProvider.md) |

## Implements

- [`IReadOnlyContextQualifierProviderValidator`](../interfaces/IReadOnlyContextQualifierProviderValidator.md)\<`T`\>

## Constructors

### Constructor

> **new ReadOnlyContextQualifierProviderValidator**\<`T`\>(`params`): `ReadOnlyContextQualifierProviderValidator`\<`T`\>

Constructs a new ReadOnlyContextQualifierProviderValidator.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IReadOnlyContextQualifierProviderValidatorCreateParams`](../interfaces/IReadOnlyContextQualifierProviderValidatorCreateParams.md)\<`T`\> | Required parameters for constructing the validator. |

#### Returns

`ReadOnlyContextQualifierProviderValidator`\<`T`\>

#### Overrides

`BaseContextQualifierProviderValidator<T>.constructor`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="provider"></a> `provider` | `readonly` | `T` | The wrapped read-only context qualifier provider. |

## Accessors

### qualifiers

#### Get Signature

> **get** **qualifiers**(): [`IReadOnlyQualifierCollector`](../../../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md)

The readonly qualifier collector that defines and validates the qualifiers for this context.

##### Returns

[`IReadOnlyQualifierCollector`](../../../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md)

#### Inherited from

`BaseContextQualifierProviderValidator.qualifiers`

## Methods

### get()

> **get**(`name`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

Gets a qualifier value by its string name, converting to strongly-typed QualifierName.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The string name to convert and look up. |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

`Success` with the [qualifier context value](../../../../../type-aliases/QualifierContextValue.md) if found,
or `Failure` with an error message if not found or an error occurs.

#### Inherited from

`BaseContextQualifierProviderValidator.get`

***

### getByIndex()

> **getByIndex**(`index`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

Gets a qualifier value by its number index, converting to strongly-typed QualifierIndex.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `index` | `number` | The number index to convert and look up. |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

`Success` with the [qualifier context value](../../../../../type-aliases/QualifierContextValue.md) if found,
or `Failure` with an error message if not found or an error occurs.

#### Inherited from

`BaseContextQualifierProviderValidator.getByIndex`

***

### getValidated()

> **getValidated**(`name`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

Gets a validated qualifier context value by its string name.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The string name to convert and look up. |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

`Success` with the validated [qualifier context value](../../../../../type-aliases/QualifierContextValue.md) if found,
or `Failure` with an error message if not found, invalid, or an error occurs.

#### Inherited from

`BaseContextQualifierProviderValidator.getValidated`

***

### getValidatedByIndex()

> **getValidatedByIndex**(`index`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

Gets a validated qualifier context value by its number index.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `index` | `number` | The number index to convert and look up. |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

`Success` with the validated [qualifier context value](../../../../../type-aliases/QualifierContextValue.md) if found,
or `Failure` with an error message if not found, invalid, or an error occurs.

#### Inherited from

`BaseContextQualifierProviderValidator.getValidatedByIndex`

***

### has()

> **has**(`name`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Checks if a qualifier value exists with the given string name.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The string name to convert and check. |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

`Success` with `true` if the qualifier value exists, `false` if it doesn't,
or `Failure` with an error message if an error occurs during the check.

#### Inherited from

`BaseContextQualifierProviderValidator.has`
