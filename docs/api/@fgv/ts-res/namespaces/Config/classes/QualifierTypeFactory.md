[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Config](../README.md) / QualifierTypeFactory

# Class: QualifierTypeFactory\<T\>

A factory that creates [QualifierType](../../../classes/QualifierType.md) instances from configuration,
supporting both built-in system types and custom external types.

This factory allows external consumers to extend the qualifier type system with their own custom types
while maintaining support for all built-in types (Language, Territory, Literal).

## Example

```typescript
// Define a custom qualifier type
class CustomQualifierType extends QualifierType {
  // ... implementation
}

// Define a discriminated union of all types
type AppQualifierType = SystemQualifierType | CustomQualifierType;

// Create a factory that handles custom types
const customFactory: IConfigInitFactory<IAnyQualifierTypeConfig, CustomQualifierType> = {
  create(config) {
    // ... handle custom type creation
  }
};

// Create the combined factory
const qualifierTypeFactory = new QualifierTypeFactory<AppQualifierType>([customFactory]);

// The factory returns T | SystemQualifierType, supporting all types
const result = qualifierTypeFactory.create(config); // Result<AppQualifierType | SystemQualifierType>
```

## Remarks

- The factory chains custom factories with the built-in factory
- Custom factories are tried first, falling back to built-in types
- The return type is a union of custom types (T) and system types

## Extends

- [`ChainedConfigInitFactory`](ChainedConfigInitFactory.md)\<[`IAnyQualifierTypeConfig`](../../QualifierTypes/namespaces/Config/type-aliases/IAnyQualifierTypeConfig.md), `T` \| [`SystemQualifierType`](../../QualifierTypes/type-aliases/SystemQualifierType.md)\>

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `T` *extends* [`QualifierType`](../../../classes/QualifierType.md) | [`SystemQualifierType`](../../QualifierTypes/type-aliases/SystemQualifierType.md) | The custom qualifier type(s) to support. Defaults to [SystemQualifierType](../../QualifierTypes/type-aliases/SystemQualifierType.md). |

## Constructors

### Constructor

> **new QualifierTypeFactory**\<`T`\>(`factories`): `QualifierTypeFactory`\<`T`\>

Constructor for a qualifier type factory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `factories` | ([`IConfigInitFactory`](../interfaces/IConfigInitFactory.md)\<[`IAnyQualifierTypeConfig`](../../QualifierTypes/namespaces/Config/type-aliases/IAnyQualifierTypeConfig.md), `T`\> \| [`QualifierTypeFactoryFunction`](../type-aliases/QualifierTypeFactoryFunction.md)\<`T`\>)[] | Array of factories for custom qualifier types. Can be: - [IConfigInitFactory](../interfaces/IConfigInitFactory.md) instances - [Factory functions](../type-aliases/QualifierTypeFactoryFunction.md) - A mix of both These are tried in order before falling back to built-in types. |

#### Returns

`QualifierTypeFactory`\<`T`\>

#### Remarks

The [built-in factory](BuiltInQualifierTypeFactory.md) is always appended to handle
         system qualifier types (Language, Territory, Literal).

#### Overrides

[`ChainedConfigInitFactory`](ChainedConfigInitFactory.md).[`constructor`](ChainedConfigInitFactory.md#constructor)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="factories"></a> `factories` | `readonly` | [`IConfigInitFactory`](../interfaces/IConfigInitFactory.md)\<[`IAnyQualifierTypeConfig`](../../QualifierTypes/namespaces/Config/type-aliases/IAnyQualifierTypeConfig.md), [`SystemQualifierType`](../../QualifierTypes/type-aliases/SystemQualifierType.md) \| `T`\>[] |

## Methods

### create()

> **create**(`config`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`SystemQualifierType`](../../QualifierTypes/type-aliases/SystemQualifierType.md) \| `T`\>

Creates a new instance of a configuration object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | [`IAnyQualifierTypeConfig`](../../QualifierTypes/namespaces/Config/type-aliases/IAnyQualifierTypeConfig.md) | The configuration object to create. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`SystemQualifierType`](../../QualifierTypes/type-aliases/SystemQualifierType.md) \| `T`\>

A result containing the new instance of the configuration object.

#### Inherited from

[`ChainedConfigInitFactory`](ChainedConfigInitFactory.md).[`create`](ChainedConfigInitFactory.md#create)
