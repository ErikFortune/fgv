[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Config](../README.md) / ValidatingQualifierTypeFactory

# Class: ValidatingQualifierTypeFactory\<T\>

A factory that validates and creates [QualifierType](../../../classes/QualifierType.md) instances
from weakly-typed configuration objects. This factory accepts configurations with unvalidated
string properties and validates them before delegating to the underlying factory chain.

This pattern is useful at package boundaries where type identity issues may occur with
branded types across different package instances.

## Example

```typescript
// Accept weakly-typed config from external source
const validatingFactory = new ValidatingQualifierTypeFactory([customFactory]);

// Config can have plain string types instead of branded types
const config = {
  name: 'my-qualifier',  // plain string, not QualifierTypeName
  systemType: 'custom',   // plain string
  configuration: { ... }
};

const result = validatingFactory.create(config); // Validates and converts internally
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* [`QualifierType`](../../../classes/QualifierType.md) | [`SystemQualifierType`](../../QualifierTypes/type-aliases/SystemQualifierType.md) |

## Implements

- [`IConfigInitFactory`](../interfaces/IConfigInitFactory.md)\<`unknown`, `T` \| [`SystemQualifierType`](../../QualifierTypes/type-aliases/SystemQualifierType.md)\>

## Constructors

### Constructor

> **new ValidatingQualifierTypeFactory**\<`T`\>(`factories`): `ValidatingQualifierTypeFactory`\<`T`\>

Constructor for a validating qualifier type factory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `factories` | ([`IConfigInitFactory`](../interfaces/IConfigInitFactory.md)\<[`IAnyQualifierTypeConfig`](../../QualifierTypes/namespaces/Config/type-aliases/IAnyQualifierTypeConfig.md), `T`\> \| [`QualifierTypeFactoryFunction`](../type-aliases/QualifierTypeFactoryFunction.md)\<`T`\>)[] | Array of factories for custom qualifier types. Can be: - [IConfigInitFactory](../interfaces/IConfigInitFactory.md) instances - [Factory functions](../type-aliases/QualifierTypeFactoryFunction.md) - A mix of both |

#### Returns

`ValidatingQualifierTypeFactory`\<`T`\>

## Methods

### create()

> **create**(`config`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`SystemQualifierType`](../../QualifierTypes/type-aliases/SystemQualifierType.md) \| `T`\>

Creates a qualifier type from a weakly-typed configuration object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | `unknown` | The configuration object to validate and use for creation. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`SystemQualifierType`](../../QualifierTypes/type-aliases/SystemQualifierType.md) \| `T`\>

A result containing the new qualifier type if successful.

#### Implementation of

[`IConfigInitFactory`](../interfaces/IConfigInitFactory.md).[`create`](../interfaces/IConfigInitFactory.md#create)
