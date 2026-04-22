[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Runtime](../../../README.md) / [Context](../README.md) / IMutableContextQualifierProvider

# Interface: IMutableContextQualifierProvider

Mutable interface for providing qualifier values in an optimized runtime context.
Extends the base interface with mutation operations and explicit mutability marker.

## Extends

- [`IContextQualifierProviderBase`](IContextQualifierProviderBase.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="mutable"></a> `mutable` | `readonly` | `true` | Explicit mutability marker for compile-time type discrimination. Always `true` for mutable providers. |
| <a id="qualifiers"></a> `qualifiers` | `readonly` | [`IReadOnlyQualifierCollector`](../../../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | The readonly qualifier collector that defines and validates the qualifiers for this context. |

## Methods

### clear()

> **clear**(): `void`

Clears all qualifier values from this provider.

#### Returns

`void`

***

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

***

### remove()

> **remove**(`name`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

Removes a qualifier value from this provider.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | [`QualifierName`](../../../../../type-aliases/QualifierName.md) | The [qualifier name](../../../../../type-aliases/QualifierName.md) to remove. |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

`Success` with the removed [qualifier context value](../../../../../type-aliases/QualifierContextValue.md) if successful,
or `Failure` with an error message if not found or an error occurs.

***

### set()

> **set**(`name`, `value`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

Sets a qualifier value in this provider.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | [`QualifierName`](../../../../../type-aliases/QualifierName.md) | The [qualifier name](../../../../../type-aliases/QualifierName.md) to set. |
| `value` | [`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md) | The [qualifier context value](../../../../../type-aliases/QualifierContextValue.md) to set. |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`QualifierContextValue`](../../../../../type-aliases/QualifierContextValue.md)\>

`Success` with the set [qualifier context value](../../../../../type-aliases/QualifierContextValue.md) if successful,
or `Failure` with an error message if not.
