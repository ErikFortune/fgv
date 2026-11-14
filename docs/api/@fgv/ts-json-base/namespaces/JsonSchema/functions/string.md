[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / string

# Function: string()

## Call Signature

> **string**(`opts`): [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`string` \| `null`\>

Creates a schema node for a JSON `string`.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | `Pick`\<[`ISchemaOptions`](../interfaces/ISchemaOptions.md), `"title"` \| `"description"` \| `"nullable"`\> & `object` & `Pick`\<[`IStringSchemaOptions`](../interfaces/IStringSchemaOptions.md), `"format"`\> & `object` & `object` \| [`ValidatedStringOptions`](../classes/ValidatedStringOptions.md)\<\{ `nullable`: `true`; \}\> | Plain options, or `stringOptions` for lengths, `pattern`, `default` or `examples`. |

### Returns

[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`string` \| `null`\>

An `ISchemaValidator` whose `Static` type is `string | null`.

## Call Signature

> **string**(`opts?`): [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`string`\>

Creates a schema node for a JSON `string`.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts?` | [`PlainStringSchemaOptions`](../type-aliases/PlainStringSchemaOptions.md) \| [`ValidatedStringOptions`](../classes/ValidatedStringOptions.md)\<[`IStringSchemaOptions`](../interfaces/IStringSchemaOptions.md)\> | Plain options, or `stringOptions` for lengths, `pattern`, `default` or `examples`. |

### Returns

[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`string`\>

An `ISchemaValidator` whose `Static` type is `string`.

### Remarks

Never fails: a raw length keyword or `pattern` is a compile error, and the options that carry one were
checked by `stringOptions`.
