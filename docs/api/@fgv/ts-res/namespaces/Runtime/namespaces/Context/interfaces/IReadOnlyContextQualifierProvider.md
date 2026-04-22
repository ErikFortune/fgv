[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Runtime](../../../README.md) / [Context](../README.md) / IReadOnlyContextQualifierProvider

# Interface: IReadOnlyContextQualifierProvider

Read-only interface for providing qualifier values in an optimized runtime context.
Explicitly marked as immutable with compile-time type discrimination.

## Extends

- [`IContextQualifierProviderBase`](IContextQualifierProviderBase.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="mutable"></a> `mutable` | `readonly` | `false` | Explicit mutability marker for compile-time type discrimination. Always `false` for read-only providers. |
| <a id="qualifiers"></a> `qualifiers` | `readonly` | [`IReadOnlyQualifierCollector`](../../../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | The readonly qualifier collector that defines and validates the qualifiers for this context. |

## Methods

### get()

> **get**(`nameOrIndexOrQualifier`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

Gets a qualifier value by its name, index, or qualifier object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `nameOrIndexOrQualifier` | [`QualifierName`](../../../../../type-aliases/QualifierName.md) \| [`QualifierIndex`](../../../../../type-aliases/QualifierIndex.md) \| [`Qualifier`](../../../../../classes/Qualifier.md) | The [qualifier name](../../../../../type-aliases/QualifierName.md), [index](../../../../../type-aliases/QualifierIndex.md), or [qualifier object](../../../../../classes/Qualifier.md) to look up. |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

`Success` with the [qualifier context value](../../../../../type-aliases/QualifierContextValue.md) if found,
or `Failure` with an error message if not found or an error occurs.

#### Inherited from

[`IContextQualifierProviderBase`](IContextQualifierProviderBase.md).[`get`](IContextQualifierProviderBase.md#get)

***

### getNames()

> **getNames**(): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`QualifierName`](../../../../../type-aliases/QualifierName.md)[]\>

Gets all available qualifier names in this context.

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`QualifierName`](../../../../../type-aliases/QualifierName.md)[]\>

`Success` with an array of all [qualifier names](../../../../../type-aliases/QualifierName.md),
or `Failure` with an error message if an error occurs.

#### Inherited from

[`IContextQualifierProviderBase`](IContextQualifierProviderBase.md).[`getNames`](IContextQualifierProviderBase.md#getnames)

***

### getValidated()

> **getValidated**(`nameOrIndexOrQualifier`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

Gets a validated qualifier context value by its name, index, or qualifier object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `nameOrIndexOrQualifier` | [`QualifierName`](../../../../../type-aliases/QualifierName.md) \| [`QualifierIndex`](../../../../../type-aliases/QualifierIndex.md) \| [`Qualifier`](../../../../../classes/Qualifier.md) | The [qualifier name](../../../../../type-aliases/QualifierName.md), [index](../../../../../type-aliases/QualifierIndex.md), or [qualifier object](../../../../../classes/Qualifier.md) to look up. |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

`Success` with the validated [qualifier context value](../../../../../type-aliases/QualifierContextValue.md) if found,
or `Failure` with an error message if not found, invalid, or an error occurs.

#### Inherited from

[`IContextQualifierProviderBase`](IContextQualifierProviderBase.md).[`getValidated`](IContextQualifierProviderBase.md#getvalidated)

***

### has()

> **has**(`name`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Checks if a qualifier value exists with the given name.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | [`QualifierName`](../../../../../type-aliases/QualifierName.md) | The [qualifier name](../../../../../type-aliases/QualifierName.md) to check. |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

`Success` with `true` if the qualifier value exists, `false` if it doesn't,
or `Failure` with an error message if an error occurs during the check.

#### Inherited from

[`IContextQualifierProviderBase`](IContextQualifierProviderBase.md).[`has`](IContextQualifierProviderBase.md#has)
