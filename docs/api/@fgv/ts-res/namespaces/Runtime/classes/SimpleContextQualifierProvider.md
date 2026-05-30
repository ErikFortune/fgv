[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Runtime](../README.md) / SimpleContextQualifierProvider

# Class: SimpleContextQualifierProvider

Simple concrete implementation of [IContextQualifierProvider](../namespaces/Context/type-aliases/IContextQualifierProvider.md)
using a `ResultMap` for qualifier value storage.

## Extends

- [`ContextQualifierProvider`](../namespaces/Context/classes/ContextQualifierProvider.md)

## Extended by

- [`ValidatingSimpleContextQualifierProvider`](ValidatingSimpleContextQualifierProvider.md)

## Implements

- [`IMutableContextQualifierProvider`](../namespaces/Context/interfaces/IMutableContextQualifierProvider.md)

## Constructors

### Constructor

> `protected` **new SimpleContextQualifierProvider**(`params`): `SimpleContextQualifierProvider`

Constructor for a SimpleContextQualifierProvider object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ISimpleContextQualifierProviderCreateParams`](../interfaces/ISimpleContextQualifierProviderCreateParams.md) | [Parameters](../interfaces/ISimpleContextQualifierProviderCreateParams.md) used to create the provider. |

#### Returns

`SimpleContextQualifierProvider`

#### Overrides

[`ContextQualifierProvider`](../namespaces/Context/classes/ContextQualifierProvider.md).[`constructor`](../namespaces/Context/classes/ContextQualifierProvider.md#constructor)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="mutable"></a> `mutable` | `readonly` | `true` | Explicit mutability marker for compile-time type discrimination. Always `true` for mutable providers. |
| <a id="qualifiers"></a> `qualifiers` | `readonly` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | The readonly qualifier collector that defines and validates the qualifiers for this context. |

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Gets the number of qualifier values in this provider.

##### Returns

`number`

The count of qualifier values.

## Methods

### clear()

> **clear**(): `void`

Clears all qualifier values from this provider.

#### Returns

`void`

#### Implementation of

[`IMutableContextQualifierProvider`](../namespaces/Context/interfaces/IMutableContextQualifierProvider.md).[`clear`](../namespaces/Context/interfaces/IMutableContextQualifierProvider.md#clear)

***

### get()

> **get**(`nameOrIndexOrQualifier`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../type-aliases/QualifierContextValue.md)\>

Gets a qualifier value by its name, index, or qualifier object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `nameOrIndexOrQualifier` | [`QualifierName`](../../../type-aliases/QualifierName.md) \| [`QualifierIndex`](../../../type-aliases/QualifierIndex.md) \| [`Qualifier`](../../../classes/Qualifier.md) | The [qualifier name](../../../type-aliases/QualifierName.md), [index](../../../type-aliases/QualifierIndex.md), or [qualifier object](../../../classes/Qualifier.md) to look up. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../type-aliases/QualifierContextValue.md)\>

`Success` with the [qualifier context value](../../../type-aliases/QualifierContextValue.md) if found,
or `Failure` with an error message if not found or an error occurs.

#### Implementation of

[`IMutableContextQualifierProvider`](../namespaces/Context/interfaces/IMutableContextQualifierProvider.md).[`get`](../namespaces/Context/interfaces/IMutableContextQualifierProvider.md#get)

#### Overrides

[`ContextQualifierProvider`](../namespaces/Context/classes/ContextQualifierProvider.md).[`get`](../namespaces/Context/classes/ContextQualifierProvider.md#get)

***

### getNames()

> **getNames**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`QualifierName`](../../../type-aliases/QualifierName.md)[]\>

Gets all available qualifier names in this context.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`QualifierName`](../../../type-aliases/QualifierName.md)[]\>

`Success` with an array of all [qualifier names](../../../type-aliases/QualifierName.md),
or `Failure` with an error message if an error occurs.

#### Implementation of

[`IMutableContextQualifierProvider`](../namespaces/Context/interfaces/IMutableContextQualifierProvider.md).[`getNames`](../namespaces/Context/interfaces/IMutableContextQualifierProvider.md#getnames)

#### Overrides

[`ContextQualifierProvider`](../namespaces/Context/classes/ContextQualifierProvider.md).[`getNames`](../namespaces/Context/classes/ContextQualifierProvider.md#getnames)

***

### getValidated()

> **getValidated**(`nameOrIndexOrQualifier`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../type-aliases/QualifierContextValue.md)\>

Gets a validated qualifier context value by its name, index, or qualifier object.
TODO: Implement validation logic using qualifier collectors.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `nameOrIndexOrQualifier` | [`QualifierName`](../../../type-aliases/QualifierName.md) \| [`QualifierIndex`](../../../type-aliases/QualifierIndex.md) \| [`Qualifier`](../../../classes/Qualifier.md) | The [qualifier name](../../../type-aliases/QualifierName.md), [index](../../../type-aliases/QualifierIndex.md), or [qualifier object](../../../classes/Qualifier.md) to look up. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../type-aliases/QualifierContextValue.md)\>

`Success` with the validated [qualifier context value](../../../type-aliases/QualifierContextValue.md) if found,
or `Failure` with an error message if not found, invalid, or an error occurs.

#### Implementation of

[`IMutableContextQualifierProvider`](../namespaces/Context/interfaces/IMutableContextQualifierProvider.md).[`getValidated`](../namespaces/Context/interfaces/IMutableContextQualifierProvider.md#getvalidated)

#### Overrides

[`ContextQualifierProvider`](../namespaces/Context/classes/ContextQualifierProvider.md).[`getValidated`](../namespaces/Context/classes/ContextQualifierProvider.md#getvalidated)

***

### has()

> **has**(`name`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Checks if a qualifier value exists with the given name.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | [`QualifierName`](../../../type-aliases/QualifierName.md) | The [qualifier name](../../../type-aliases/QualifierName.md) to check. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

`Success` with `true` if the qualifier value exists, `false` if it doesn't,
or `Failure` with an error message if an error occurs during the check.

#### Implementation of

[`IMutableContextQualifierProvider`](../namespaces/Context/interfaces/IMutableContextQualifierProvider.md).[`has`](../namespaces/Context/interfaces/IMutableContextQualifierProvider.md#has)

#### Overrides

[`ContextQualifierProvider`](../namespaces/Context/classes/ContextQualifierProvider.md).[`has`](../namespaces/Context/classes/ContextQualifierProvider.md#has)

***

### remove()

> **remove**(`name`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../type-aliases/QualifierContextValue.md)\>

Removes a qualifier value from this provider.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | [`QualifierName`](../../../type-aliases/QualifierName.md) | The [qualifier name](../../../type-aliases/QualifierName.md) to remove. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../type-aliases/QualifierContextValue.md)\>

`Success` with the removed [qualifier context value](../../../type-aliases/QualifierContextValue.md) if successful,
or `Failure` with an error message if not found or an error occurs.

#### Implementation of

[`IMutableContextQualifierProvider`](../namespaces/Context/interfaces/IMutableContextQualifierProvider.md).[`remove`](../namespaces/Context/interfaces/IMutableContextQualifierProvider.md#remove)

***

### set()

> **set**(`name`, `value`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../type-aliases/QualifierContextValue.md)\>

Sets a qualifier value in this provider.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | [`QualifierName`](../../../type-aliases/QualifierName.md) | The [qualifier name](../../../type-aliases/QualifierName.md) to set. |
| `value` | [`QualifierContextValue`](../../../type-aliases/QualifierContextValue.md) | The [qualifier context value](../../../type-aliases/QualifierContextValue.md) to set. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../type-aliases/QualifierContextValue.md)\>

`Success` with the set [qualifier context value](../../../type-aliases/QualifierContextValue.md) if successful,
or `Failure` with an error message if not.

#### Implementation of

[`IMutableContextQualifierProvider`](../namespaces/Context/interfaces/IMutableContextQualifierProvider.md).[`set`](../namespaces/Context/interfaces/IMutableContextQualifierProvider.md#set)

***

### create()

> `static` **create**(`params`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`SimpleContextQualifierProvider`\>

Creates a new SimpleContextQualifierProvider object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ISimpleContextQualifierProviderCreateParams`](../interfaces/ISimpleContextQualifierProviderCreateParams.md) | [Parameters](../interfaces/ISimpleContextQualifierProviderCreateParams.md) used to create the provider. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`SimpleContextQualifierProvider`\>

`Success` with the new SimpleContextQualifierProvider object if successful,
or `Failure` with an error message if not.
