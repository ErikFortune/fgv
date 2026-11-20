[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / array

# Function: array()

## Call Signature

> **array**\<`S`\>(`items`, `opts`): [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<[`Static`](../type-aliases/Static.md)\<`S`\>[] \| `null`\>

Creates a schema node for a JSON `array` whose elements all match `items`.

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-s"></a> `S` *extends* [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`unknown`\> |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `items` | `S` | The schema applied to every element. |
| `opts` | `Pick`\<[`ISchemaOptions`](../interfaces/ISchemaOptions.md), `"title"` \| `"description"` \| `"nullable"`\> & `object` & `object` \| [`ValidatedSchemaOptions`](../classes/ValidatedSchemaOptions.md)\<\{ `nullable`: `true`; \}\> | Plain options, or `schemaOptions` for `default` or `examples`. |

### Returns

[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<[`Static`](../type-aliases/Static.md)\<`S`\>[] \| `null`\>

An `ISchemaValidator` whose `Static` type is `Array<Static<S>> | null`.

## Call Signature

> **array**\<`S`\>(`items`, `opts?`): [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<[`Static`](../type-aliases/Static.md)\<`S`\>[]\>

Creates a schema node for a JSON `array` whose elements all match `items`.

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-s-1"></a> `S` *extends* [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`unknown`\> |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `items` | `S` | The schema applied to every element. |
| `opts?` | [`PlainSchemaOptions`](../type-aliases/PlainSchemaOptions.md) \| [`ValidatedSchemaOptions`](../classes/ValidatedSchemaOptions.md)\<[`IObjectSchemaOptions`](../interfaces/IObjectSchemaOptions.md)\> | Plain options (description, nullability), or `schemaOptions` for `default` or `examples`. |

### Returns

[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<[`Static`](../type-aliases/Static.md)\<`S`\>[]\>

An `ISchemaValidator` whose `Static` type is `Array<Static<S>>`.
