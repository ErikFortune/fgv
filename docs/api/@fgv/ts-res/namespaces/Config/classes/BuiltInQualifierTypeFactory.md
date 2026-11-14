[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Config](../README.md) / BuiltInQualifierTypeFactory

# Class: BuiltInQualifierTypeFactory

A factory that creates a [SystemQualifierType](../../QualifierTypes/type-aliases/SystemQualifierType.md) from
[any qualifier type configuration](../../QualifierTypes/namespaces/Config/type-aliases/IAnyQualifierTypeConfig.md).

## Implements

- [`IConfigInitFactory`](../interfaces/IConfigInitFactory.md)\<[`ISystemQualifierTypeConfig`](../../QualifierTypes/namespaces/Config/type-aliases/ISystemQualifierTypeConfig.md), [`SystemQualifierType`](../../QualifierTypes/type-aliases/SystemQualifierType.md)\>

## Constructors

### Constructor

> **new BuiltInQualifierTypeFactory**(): `BuiltInQualifierTypeFactory`

#### Returns

`BuiltInQualifierTypeFactory`

## Methods

### create()

> **create**(`config`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`SystemQualifierType`](../../QualifierTypes/type-aliases/SystemQualifierType.md)\>

Creates a new instance of a configuration object.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `config` | [`IAnyQualifierTypeConfig`](../../QualifierTypes/namespaces/Config/type-aliases/IAnyQualifierTypeConfig.md) | The configuration object to create. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`SystemQualifierType`](../../QualifierTypes/type-aliases/SystemQualifierType.md)\>

A result containing the new instance of the configuration object.

#### Implementation of

[`IConfigInitFactory`](../interfaces/IConfigInitFactory.md).[`create`](../interfaces/IConfigInitFactory.md#create)
