[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / anyValue

# Function: anyValue()

> **anyValue**(`opts?`): [`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<[`JsonValue`](../../../type-aliases/JsonValue.md)\>

Creates a schema node that accepts any JSON value — JSON Schema's `{}`, pydantic's `Any`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `opts?` | [`PlainAnySchemaOptions`](../type-aliases/PlainAnySchemaOptions.md) \| [`ValidatedSchemaOptions`](../classes/ValidatedSchemaOptions.md)\<[`IAnySchemaOptions`](../type-aliases/IAnySchemaOptions.md)\> | Plain annotations, or `schemaOptions` for `default` or `examples`. |

## Returns

[`ISchemaValidator`](../interfaces/ISchemaValidator.md)\<[`JsonValue`](../../../type-aliases/JsonValue.md)\>

An `ISchemaValidator` whose `Static` type is `JsonValue`.

## Remarks

Emits `{}` plus any annotations. The validator accepts any `JsonValue`, `null` included, and
returns a copy; a value that is not JSON (`undefined`, a function, a class instance) is refused.

Its wire form has no `type`, and some providers require one on every schema (Gemini; OpenAI
strict mode). The provider adapters in `@fgv/ts-extras` refuse a request that would send it to
such a provider, naming the tool and the path, rather than substitute a type — which would narrow
what the model may send below what the validator accepts.
