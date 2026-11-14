[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / optional

# Function: optional()

> **optional**\<`S`\>(`schema`): [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<[`Static`](../type-aliases/Static.md)\<`S`\> \| `undefined`\>

Marks a property schema as optional within an `object` schema.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-s"></a> `S` *extends* [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`unknown`\> |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `schema` | `S` | The inner schema to make optional. |

## Returns

[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<[`Static`](../type-aliases/Static.md)\<`S`\> \| `undefined`\>

An `ISchemaValidator` whose `Static` type is `Static<S> | undefined`.
