[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Runtime](../../../README.md) / [Context](../README.md) / IMutableContextQualifierProviderValidator

# Interface: IMutableContextQualifierProviderValidator\<T\>

A mutable interface for validators wrapping mutable context qualifier providers.
Extends the base interface with mutation operations and provides compile-time type safety.

## Extends

- [`IContextQualifierProviderValidatorBase`](IContextQualifierProviderValidatorBase.md)\<`T`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* [`IMutableContextQualifierProvider`](IMutableContextQualifierProvider.md) | [`IMutableContextQualifierProvider`](IMutableContextQualifierProvider.md) |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="provider"></a> `provider` | `readonly` | `T` | The wrapped mutable context qualifier provider. |
| <a id="qualifiers"></a> `qualifiers` | `readonly` | [`IReadOnlyQualifierCollector`](../../../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | The readonly qualifier collector that defines and validates the qualifiers for this context. |

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

[`IContextQualifierProviderValidatorBase`](IContextQualifierProviderValidatorBase.md).[`get`](IContextQualifierProviderValidatorBase.md#get)

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

[`IContextQualifierProviderValidatorBase`](IContextQualifierProviderValidatorBase.md).[`getByIndex`](IContextQualifierProviderValidatorBase.md#getbyindex)

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

[`IContextQualifierProviderValidatorBase`](IContextQualifierProviderValidatorBase.md).[`getValidated`](IContextQualifierProviderValidatorBase.md#getvalidated)

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

[`IContextQualifierProviderValidatorBase`](IContextQualifierProviderValidatorBase.md).[`getValidatedByIndex`](IContextQualifierProviderValidatorBase.md#getvalidatedbyindex)

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

[`IContextQualifierProviderValidatorBase`](IContextQualifierProviderValidatorBase.md).[`has`](IContextQualifierProviderValidatorBase.md#has)

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
