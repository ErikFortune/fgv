[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / enumOf

# Function: enumOf()

## Call Signature

> **enumOf**\<`T`\>(`values`, `opts`): [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`T` \| `null`\>

Creates a schema node for a closed set of string literals.

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` *extends* `string` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values` | readonly `T`[] | The allowed string values. |
| `opts` | `Pick`\<[`ISchemaOptions`](../interfaces/ISchemaOptions.md), `"title"` \| `"description"` \| `"nullable"`\> & `object` & `object` \| [`ValidatedSchemaOptions`](../classes/ValidatedSchemaOptions.md)\<\{ `nullable`: `true`; \}\> | Plain options, or `schemaOptions` for `default` or `examples`. |

### Returns

[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`T` \| `null`\>

An `ISchemaValidator` whose `Static` type is the union of `values`, or `null`.

## Call Signature

> **enumOf**\<`T`\>(`values`, `opts?`): [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`T`\>

Creates a schema node for a closed set of string literals.

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t-1"></a> `T` *extends* `string` |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values` | readonly `T`[] | The allowed string values. |
| `opts?` | [`PlainSchemaOptions`](../type-aliases/PlainSchemaOptions.md) \| [`ValidatedSchemaOptions`](../classes/ValidatedSchemaOptions.md)\<[`IObjectSchemaOptions`](../interfaces/IObjectSchemaOptions.md)\> | Plain options (description, nullability), or `schemaOptions` for `default` or `examples`. A nullable enum also carries `null` in its emitted `enum` list, so the two halves of the node cannot disagree. |

### Returns

[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`T`\>

An `ISchemaValidator` whose `Static` type is the union of `values`.
