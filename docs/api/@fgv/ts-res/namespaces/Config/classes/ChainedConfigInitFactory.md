[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Config](../README.md) / ChainedConfigInitFactory

# Class: ChainedConfigInitFactory\<TConfig, T\>

A factory that chains multiple factories together.

## Extended by

- [`QualifierTypeFactory`](QualifierTypeFactory.md)
- [`ResourceTypeFactory`](ResourceTypeFactory.md)

## Type Parameters

| Type Parameter |
| ------ |
| `TConfig` |
| `T` |

## Implements

- [`IConfigInitFactory`](../interfaces/IConfigInitFactory.md)\<`TConfig`, `T`\>

## Constructors

### Constructor

> **new ChainedConfigInitFactory**\<`TConfig`, `T`\>(`factories`): `ChainedConfigInitFactory`\<`TConfig`, `T`\>

Constructor for a chained config init factory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `factories` | [`IConfigInitFactory`](../interfaces/IConfigInitFactory.md)\<`TConfig`, `T`\>[] | The factories to chain. |

#### Returns

`ChainedConfigInitFactory`\<`TConfig`, `T`\>

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="factories"></a> `factories` | `readonly` | [`IConfigInitFactory`](../interfaces/IConfigInitFactory.md)\<`TConfig`, `T`\>[] |

## Methods

### create()

> **create**(`config`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

Creates a new instance of a configuration object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | `TConfig` | The configuration object to create. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`T`\>

A result containing the new instance of the configuration object.

#### Implementation of

[`IConfigInitFactory`](../interfaces/IConfigInitFactory.md).[`create`](../interfaces/IConfigInitFactory.md#create)
