[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / toGeminiParameterSchema

# Function: toGeminiParameterSchema()

> **toGeminiParameterSchema**(`schema`): [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md)

Sanitizes a draft-07 JSON Schema (as emitted by `JsonSchema.object(...).toJson()`)
into the OpenAPI 3.0 Schema Object subset that Gemini's `function_declarations[].parameters`
accepts.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `schema` | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | A draft-07 JSON Schema. |

## Returns

[`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md)

The schema in Gemini's OpenAPI 3.0 subset.

## Remarks

Gemini's function-declaration schema is **not** full JSON Schema — it is a subset of
the OpenAPI 3.0 Schema Object and **rejects** (rather than ignores) draft-07-only
keywords. `JsonSchema` objects are strict-by-default, so `.toJson()` emits
`additionalProperties: false` on every object node, which 400s the whole request on
Gemini. This helper recursively strips the unsupported keywords so any
`JsonSchema`-authored client tool works on Gemini without consumer awareness of the
dialect difference. Stripping is infallible, so it returns a plain value rather than a
`Result`.

`additionalProperties` and `$schema` are stripped only where they appear as schema
*keywords* (siblings of `type`/`properties`/etc.). Inside a `properties` map the keys
are user-defined parameter names, not keywords, so they are preserved verbatim while
each property's subschema value is still recursively sanitized — a tool parameter
legitimately named `additionalProperties` survives.

Only the **dialect** is translated: constraint and annotation keywords pass through as written.
`toGeminiTools` and the Gemini structured-output wire adapt those first, to what Gemini
documents; call this directly only to build a Gemini schema yourself — for example a wire probe
that must send a keyword unadapted to observe whether Gemini accepts it.
