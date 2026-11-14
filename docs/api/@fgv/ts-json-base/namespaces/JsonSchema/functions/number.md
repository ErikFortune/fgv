[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / number

# Function: number()

## Call Signature

> **number**(`opts`): [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`number` \| `null`\>

Creates a schema node for a JSON `number`.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts` | `Pick`\<[`ISchemaOptions`](../interfaces/ISchemaOptions.md), `"title"` \| `"description"` \| `"nullable"`\> & `object` & `Pick`\<[`INumberSchemaOptions`](../interfaces/INumberSchemaOptions.md), `"strict"`\> & `object` & `object` \| [`ValidatedNumberOptions`](../classes/ValidatedNumberOptions.md)\<\{ `nullable`: `true`; \}\> | Plain options, or `numberOptions` for range keywords, `default` or `examples`. |

### Returns

[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`number` \| `null`\>

An `ISchemaValidator` whose `Static` type is `number | null`.

## Call Signature

> **number**(`opts?`): [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`number`\>

Creates a schema node for a JSON `number`.

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts?` | [`PlainNumberSchemaOptions`](../type-aliases/PlainNumberSchemaOptions.md) \| [`ValidatedNumberOptions`](../classes/ValidatedNumberOptions.md)\<[`INumberSchemaOptions`](../interfaces/INumberSchemaOptions.md)\> | Plain options (description, nullability, strict mode — see `INumberSchemaOptions`), or `numberOptions` for range keywords, `default` or `examples`. |

### Returns

[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`number`\>

An `ISchemaValidator` whose `Static` type is `number`.

### Remarks

Never fails: a raw range keyword is a compile error, and the options that carry one were checked
by `numberOptions` (or `integerOptions`, whose check is
stricter).
