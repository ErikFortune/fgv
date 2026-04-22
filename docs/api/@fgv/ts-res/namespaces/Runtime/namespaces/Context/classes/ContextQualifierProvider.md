[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Runtime](../../../README.md) / [Context](../README.md) / ContextQualifierProvider

# Abstract Class: ContextQualifierProvider

Abstract base class for implementing context qualifier providers.
Provides common functionality and enforces the contract for derived classes.

## Extended by

- [`SimpleContextQualifierProvider`](../../../classes/SimpleContextQualifierProvider.md)

## Implements

- [`IContextQualifierProviderBase`](../interfaces/IContextQualifierProviderBase.md)

## Constructors

### Constructor

> **new ContextQualifierProvider**(): `ContextQualifierProvider`

#### Returns

`ContextQualifierProvider`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="qualifiers"></a> `qualifiers` | `abstract` | [`IReadOnlyQualifierCollector`](../../../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | The readonly qualifier collector that defines and validates the qualifiers for this context. |

## Methods

### get()

> `abstract` **get**(`nameOrIndexOrQualifier`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

Gets a qualifier value by its name, index, or qualifier object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `nameOrIndexOrQualifier` | [`QualifierName`](../../../../../type-aliases/QualifierName.md) \| [`QualifierIndex`](../../../../../type-aliases/QualifierIndex.md) \| [`Qualifier`](../../../../../classes/Qualifier.md) | The [qualifier name](../../../../../type-aliases/QualifierName.md), [index](../../../../../type-aliases/QualifierIndex.md), or [qualifier object](../../../../../classes/Qualifier.md) to look up. |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

`Success` with the [qualifier context value](../../../../../type-aliases/QualifierContextValue.md) if found,
or `Failure` with an error message if not found or an error occurs.

#### Implementation of

[`IContextQualifierProviderBase`](../interfaces/IContextQualifierProviderBase.md).[`get`](../interfaces/IContextQualifierProviderBase.md#get)

***

### getNames()

> `abstract` **getNames**(): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`QualifierName`](../../../../../type-aliases/QualifierName.md)[]\>

Gets all available qualifier names in this context.

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`QualifierName`](../../../../../type-aliases/QualifierName.md)[]\>

`Success` with an array of all [qualifier names](../../../../../type-aliases/QualifierName.md),
or `Failure` with an error message if an error occurs.

#### Implementation of

[`IContextQualifierProviderBase`](../interfaces/IContextQualifierProviderBase.md).[`getNames`](../interfaces/IContextQualifierProviderBase.md#getnames)

***

### getValidated()

> `abstract` **getValidated**(`nameOrIndexOrQualifier`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

Gets a validated qualifier context value by its name, index, or qualifier object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `nameOrIndexOrQualifier` | [`QualifierName`](../../../../../type-aliases/QualifierName.md) \| [`QualifierIndex`](../../../../../type-aliases/QualifierIndex.md) \| [`Qualifier`](../../../../../classes/Qualifier.md) | The [qualifier name](../../../../../type-aliases/QualifierName.md), [index](../../../../../type-aliases/QualifierIndex.md), or [qualifier object](../../../../../classes/Qualifier.md) to look up. |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

`Success` with the validated [qualifier context value](../../../../../type-aliases/QualifierContextValue.md) if found,
or `Failure` with an error message if not found, invalid, or an error occurs.

#### Implementation of

[`IContextQualifierProviderBase`](../interfaces/IContextQualifierProviderBase.md).[`getValidated`](../interfaces/IContextQualifierProviderBase.md#getvalidated)

***

### has()

> `abstract` **has**(`name`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Checks if a qualifier value exists with the given name.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | [`QualifierName`](../../../../../type-aliases/QualifierName.md) | The [qualifier name](../../../../../type-aliases/QualifierName.md) to check. |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

`Success` with `true` if the qualifier value exists, `false` if it doesn't,
or `Failure` with an error message if an error occurs during the check.

#### Implementation of

[`IContextQualifierProviderBase`](../interfaces/IContextQualifierProviderBase.md).[`has`](../interfaces/IContextQualifierProviderBase.md#has)
