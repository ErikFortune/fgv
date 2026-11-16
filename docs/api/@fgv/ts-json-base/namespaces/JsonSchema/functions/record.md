[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / record

# Function: record()

## Call Signature

> **record**\<`S`\>(`values`, `opts`): [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`Record`\<`string`, [`Static`](../type-aliases/Static.md)\<`S`\>\> \| `null`\>

Creates a schema node for a JSON object used as a map: any keys, each value matching `values`
(pydantic `dict[str, T]`, zod `z.record(T)`).

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-s"></a> `S` *extends* [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`unknown`\> |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values` | `S` & (`undefined` *extends* [`Static`](../type-aliases/Static.md)\<`S`\> ? `never` : `unknown`) | The schema every property value must match. |
| `opts` | `Pick`\<[`ISchemaOptions`](../interfaces/ISchemaOptions.md), `"title"` \| `"description"` \| `"nullable"`\> & `object` & `object` \| [`ValidatedSchemaOptions`](../classes/ValidatedSchemaOptions.md)\<\{ `nullable`: `true`; \}\> | Plain options, or `schemaOptions` for `default` or `examples`. |

### Returns

[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`Record`\<`string`, [`Static`](../type-aliases/Static.md)\<`S`\>\> \| `null`\>

An `ISchemaValidator` whose `Static` type is `Record<string, Static<S>> | null`.

### Remarks

Emits `{ type: 'object', properties: {}, additionalProperties: <values> }`, and the validator
converts every property through `values`, reporting each one that fails. A value that is not a
JSON object is refused. As for an open object, an own `"__proto__"` key is dropped — without
being validated — rather than carried.

Providers whose strict structured-output mode requires `additionalProperties: false` (OpenAI
strict, Anthropic JSON outputs) cannot accept a record there, exactly as they cannot accept an
open object; it is suited to tool parameters.
A value schema whose static type admits `undefined` (such as `optional(...)`) is refused at
compile time, and an own property whose value is `undefined` is refused at run time either way:
`undefined` is not JSON, and the emitted `additionalProperties` schema does not admit it.

## Call Signature

> **record**\<`S`\>(`values`, `opts?`): [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`Record`\<`string`, [`Static`](../type-aliases/Static.md)\<`S`\>\>\>

Creates a schema node for a JSON object used as a map: any keys, each value matching `values`
(pydantic `dict[str, T]`, zod `z.record(T)`).

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-s-1"></a> `S` *extends* [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`unknown`\> |

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `values` | `S` & (`undefined` *extends* [`Static`](../type-aliases/Static.md)\<`S`\> ? `never` : `unknown`) | The schema every property value must match. |
| `opts?` | [`PlainSchemaOptions`](../type-aliases/PlainSchemaOptions.md) \| [`ValidatedSchemaOptions`](../classes/ValidatedSchemaOptions.md)\<[`IObjectSchemaOptions`](../interfaces/IObjectSchemaOptions.md)\> | Plain options (description, nullability), or `schemaOptions` for `default` or `examples`. |

### Returns

[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<`Record`\<`string`, [`Static`](../type-aliases/Static.md)\<`S`\>\>\>

An `ISchemaValidator` whose `Static` type is `Record<string, Static<S>>`.
