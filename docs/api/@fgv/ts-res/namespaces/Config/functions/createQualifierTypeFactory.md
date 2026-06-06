[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Config](../README.md) / createQualifierTypeFactory

# Function: createQualifierTypeFactory()

> **createQualifierTypeFactory**\<`T`\>(`fn`): [`IConfigInitFactory`](../interfaces/IConfigInitFactory.md)\<[`IAnyQualifierTypeConfig`](../../QualifierTypes/namespaces/Config/type-aliases/IAnyQualifierTypeConfig.md), `T`\>

Creates a [IConfigInitFactory](../interfaces/IConfigInitFactory.md) from a factory function.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* [`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\> | [`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\> |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fn` | [`QualifierTypeFactoryFunction`](../type-aliases/QualifierTypeFactoryFunction.md)\<`T`\> | The factory function to wrap. |

## Returns

[`IConfigInitFactory`](../interfaces/IConfigInitFactory.md)\<[`IAnyQualifierTypeConfig`](../../QualifierTypes/namespaces/Config/type-aliases/IAnyQualifierTypeConfig.md), `T`\>

An `IConfigInitFactory` instance that delegates to the function.
