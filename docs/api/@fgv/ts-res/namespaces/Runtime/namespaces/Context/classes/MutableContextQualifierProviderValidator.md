[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Runtime](../../../README.md) / [Context](../README.md) / MutableContextQualifierProviderValidator

# Class: MutableContextQualifierProviderValidator\<T\>

A validator for mutable context qualifier providers that accepts string inputs
and converts them to strongly-typed values before calling the wrapped provider.
Provides both read and mutation operations.

## Extends

- [`BaseContextQualifierProviderValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\<`T`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* [`IMutableContextQualifierProvider`](../interfaces/IMutableContextQualifierProvider.md) | [`IMutableContextQualifierProvider`](../interfaces/IMutableContextQualifierProvider.md) |

## Implements

- [`IMutableContextQualifierProviderValidator`](../interfaces/IMutableContextQualifierProviderValidator.md)\<`T`\>

## Constructors

### Constructor

> **new MutableContextQualifierProviderValidator**\<`T`\>(`params`): `MutableContextQualifierProviderValidator`\<`T`\>

Constructs a new MutableContextQualifierProviderValidator.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IMutableContextQualifierProviderValidatorCreateParams`](../interfaces/IMutableContextQualifierProviderValidatorCreateParams.md)\<`T`\> | Required parameters for constructing the validator. |

#### Returns

`MutableContextQualifierProviderValidator`\<`T`\>

#### Overrides

`BaseContextQualifierProviderValidator<T>.constructor`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="provider"></a> `provider` | `readonly` | `T` | The wrapped mutable context qualifier provider. |

## Accessors

### qualifiers

#### Get Signature

> **get** **qualifiers**(): [`IReadOnlyQualifierCollector`](../../../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md)

The readonly qualifier collector that defines and validates the qualifiers for this context.

##### Returns

[`IReadOnlyQualifierCollector`](../../../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md)

The readonly qualifier collector that defines and validates the qualifiers for this context.

#### Implementation of

[`IMutableContextQualifierProviderValidator`](../interfaces/IMutableContextQualifierProviderValidator.md).[`qualifiers`](../interfaces/IMutableContextQualifierProviderValidator.md#qualifiers)

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

#### Implementation of

[`IMutableContextQualifierProviderValidator`](../interfaces/IMutableContextQualifierProviderValidator.md).[`get`](../interfaces/IMutableContextQualifierProviderValidator.md#get)

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

#### Implementation of

[`IMutableContextQualifierProviderValidator`](../interfaces/IMutableContextQualifierProviderValidator.md).[`getByIndex`](../interfaces/IMutableContextQualifierProviderValidator.md#getbyindex)

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

#### Implementation of

[`IMutableContextQualifierProviderValidator`](../interfaces/IMutableContextQualifierProviderValidator.md).[`getValidated`](../interfaces/IMutableContextQualifierProviderValidator.md#getvalidated)

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

#### Implementation of

[`IMutableContextQualifierProviderValidator`](../interfaces/IMutableContextQualifierProviderValidator.md).[`getValidatedByIndex`](../interfaces/IMutableContextQualifierProviderValidator.md#getvalidatedbyindex)

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

#### Implementation of

[`IMutableContextQualifierProviderValidator`](../interfaces/IMutableContextQualifierProviderValidator.md).[`has`](../interfaces/IMutableContextQualifierProviderValidator.md#has)

#### Inherited from

`BaseContextQualifierProviderValidator.has`

***

### remove()

> **remove**(`name`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

Removes a qualifier value using string input, converting to strongly-typed QualifierName.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The string name to convert. |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

`Success` with the removed [qualifier context value](../../../../../type-aliases/QualifierContextValue.md) if successful,
or `Failure` with an error message if an error occurs.

#### Implementation of

[`IMutableContextQualifierProviderValidator`](../interfaces/IMutableContextQualifierProviderValidator.md).[`remove`](../interfaces/IMutableContextQualifierProviderValidator.md#remove)

***

### set()

> **set**(`name`, `value`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

Sets a qualifier value using string inputs, converting to strongly-typed values.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | The string name to convert. |
| `value` | `string` | The string value to convert. |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

`Success` with the set [qualifier context value](../../../../../type-aliases/QualifierContextValue.md) if successful,
or `Failure` with an error message if an error occurs.

#### Implementation of

[`IMutableContextQualifierProviderValidator`](../interfaces/IMutableContextQualifierProviderValidator.md).[`set`](../interfaces/IMutableContextQualifierProviderValidator.md#set)
