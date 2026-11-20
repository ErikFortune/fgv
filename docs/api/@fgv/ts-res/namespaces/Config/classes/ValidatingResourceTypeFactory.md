[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Config](../README.md) / ValidatingResourceTypeFactory

# Class: ValidatingResourceTypeFactory

A factory that validates and creates [ResourceType](../../../classes/ResourceType.md) instances
from weakly-typed configuration objects. This factory accepts configurations with unvalidated
string properties and validates them before delegating to the underlying factory chain.

This pattern is useful at package boundaries where type identity issues may occur with
branded types across different package instances.

## Implements

- [`IConfigInitFactory`](../interfaces/IConfigInitFactory.md)\<`unknown`, [`ResourceType`](../../../classes/ResourceType.md)\>

## Constructors

### Constructor

> **new ValidatingResourceTypeFactory**(`factories`): `ValidatingResourceTypeFactory`

Constructor for a validating resource type factory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `factories` | ([`ResourceTypeFactoryFunction`](../type-aliases/ResourceTypeFactoryFunction.md) \| [`IConfigInitFactory`](../interfaces/IConfigInitFactory.md)\<[`IResourceTypeConfig`](../../ResourceTypes/namespaces/Config/interfaces/IResourceTypeConfig.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>, [`ResourceType`](../../../classes/ResourceType.md)\<`unknown`\>\>)[] | Array of factories for resource types. Can be: - [IConfigInitFactory](../interfaces/IConfigInitFactory.md) instances - [Factory functions](../type-aliases/ResourceTypeFactoryFunction.md) - A mix of both |

#### Returns

`ValidatingResourceTypeFactory`

## Methods

### create()

> **create**(`config`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceType`](../../../classes/ResourceType.md)\<`unknown`\>\>

Creates a resource type from a weakly-typed configuration object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | `unknown` | The configuration object to validate and use for creation. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ResourceType`](../../../classes/ResourceType.md)\<`unknown`\>\>

A result containing the new resource type if successful.

#### Implementation of

[`IConfigInitFactory`](../interfaces/IConfigInitFactory.md).[`create`](../interfaces/IConfigInitFactory.md#create)
