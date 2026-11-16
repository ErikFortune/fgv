[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / integer

# Function: integer()

## Call Signature

> **integer**(`opts`): [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`number` \| `null`\>

Creates a schema node for a JSON `integer`.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | `Pick`\<[`ISchemaOptions`](../interfaces/ISchemaOptions.md), `"title"` \| `"description"` \| `"nullable"`\> & `object` & `Pick`\<[`INumberSchemaOptions`](../interfaces/INumberSchemaOptions.md), `"strict"`\> & `object` & `object` \| [`ValidatedIntegerOptions`](../classes/ValidatedIntegerOptions.md)\<\{ `nullable`: `true`; \}\> | Plain options, or `integerOptions` for range keywords, `default` or `examples`. |

### Returns

[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`number` \| `null`\>

An `ISchemaValidator` (tagged `integer`) whose `Static` type is `number | null`.

## Call Signature

> **integer**(`opts?`): [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`number`\>

Creates a schema node for a JSON `integer`.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts?` | [`PlainNumberSchemaOptions`](../type-aliases/PlainNumberSchemaOptions.md) \| [`ValidatedIntegerOptions`](../classes/ValidatedIntegerOptions.md)\<[`INumberSchemaOptions`](../interfaces/INumberSchemaOptions.md)\> | Plain options (description, nullability, strict mode — see `INumberSchemaOptions`), or `integerOptions` for range keywords, `default` or `examples`. |

### Returns

[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`number`\>

An `ISchemaValidator` (tagged `integer`) whose `Static` type is `number`.

### Remarks

Never fails: a raw range keyword is a compile error, and the options that carry one were checked
by `integerOptions`. Options from `numberOptions` are refused at
compile time, since a range holding a number need not hold an integer.
