[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / boolean

# Function: boolean()

## Call Signature

> **boolean**(`opts`): [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`boolean` \| `null`\>

Creates a schema node for a JSON `boolean`.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | `Pick`\<[`ISchemaOptions`](../interfaces/ISchemaOptions.md), `"title"` \| `"description"` \| `"nullable"`\> & `object` & `object` \| [`ValidatedSchemaOptions`](../classes/ValidatedSchemaOptions.md)\<\{ `nullable`: `true`; \}\> | Plain options, or `schemaOptions` for `default` or `examples`. |

### Returns

[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`boolean` \| `null`\>

An `ISchemaValidator` whose `Static` type is `boolean | null`.

## Call Signature

> **boolean**(`opts?`): [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`boolean`\>

Creates a schema node for a JSON `boolean`.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts?` | [`PlainSchemaOptions`](../type-aliases/PlainSchemaOptions.md) \| [`ValidatedSchemaOptions`](../classes/ValidatedSchemaOptions.md)\<[`IObjectSchemaOptions`](../interfaces/IObjectSchemaOptions.md)\> | Plain options, or `schemaOptions` for `default` or `examples`. |

### Returns

[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`boolean`\>

An `ISchemaValidator` whose `Static` type is `boolean`.
