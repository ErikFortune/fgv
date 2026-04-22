[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Config](../README.md) / IConfigInitFactory

# Interface: IConfigInitFactory\<TConfig, T\>

Interface for a factory that creates a new instance of a configuration object.

## Type Parameters

| Type Parameter |
| ------ |
| `TConfig` |
| `T` |

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
