[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / IObjectSchemaOptions

# Interface: IObjectSchemaOptions

Options for the `object` factory.

## Extends

- [`ISchemaOptions`](ISchemaOptions.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-additionalproperties"></a> `additionalProperties?` | `boolean` | Whether the object is open to properties it does not declare. **Remarks** When `false` (default), the validator rejects any undeclared property and the emitted schema sets `additionalProperties: false`. When `true`, the object is **open**: declared properties convert through their schemas as usual, every undeclared property is carried through to the result as a validated `JsonValue` (after the declared ones), and the emitted schema omits `additionalProperties`, which JSON Schema reads as open. A value that is not a JSON object, or an undeclared property that is not a JSON value, is refused. The static type widens to `OpenObjectStatic`. Either way, what the validator accepts is what the wire schema states: the converter never drops a key the schema told the model it could send — with one exception, an own `"__proto__"` key, which is dropped at every depth rather than carried (see `Converters.jsonObject`). |
| <a id="property-default"></a> `default?` | [`JsonValue`](../../../type-aliases/JsonValue.md) | The value a consumer should assume when none is supplied, emitted as the JSON Schema `default` annotation. **Remarks** An **annotation**: emitted, never enforced, and never applied. The validator does not substitute it for a missing value. It must be a JSON value, so it reaches a factory only through validated options, which refuse one that is not. It is deliberately **not** checked against the node: JSON Schema does not require a `default` to validate, and checking it would refuse schemas servers already send. |
| <a id="property-description"></a> `description?` | `string` | Optional human-readable description emitted into the wire JSON Schema. |
| <a id="property-examples"></a> `examples?` | readonly [`JsonValue`](../../../type-aliases/JsonValue.md)[] | Example values, emitted as the JSON Schema `examples` annotation. **Remarks** An **annotation**, under the same rules as `default`: each member must be a JSON value, and none is checked against the node. |
| <a id="property-nullable"></a> `nullable?` | `boolean` | When `true`, the value may also be `null`: the derived static type widens to `T \| null`, the validator accepts `null`, and the wire schema declares a union `type` (`['string', 'null']`). **Remarks** **This is how you express an absent-able field to a provider that requires every property to be required.** OpenAI's strict structured output rejects a schema with any property missing from `required`, so `optional(...)` is unsendable there — see `hasOptionalProperties` in `@fgv/ts-extras`, which refuses rather than relocating the failure into a provider 400. A required-and-nullable property is the sanctioned spelling, and because the schema *is* the validator, the wire shape and the check cannot disagree about it. **If the field is genuinely absent-able *and* `null`-able, say both:** `optional(string({ nullable: true }))` accepts absent, `null`, or a value. That composition is what `@fgv/ts-extras`' `adaptOptionalToNullable` looks for — on a format requiring every property to be required, it drops the optionality for the wire, which is safe precisely because the authored schema already accepts the `null` the model will then have to send. Reach for it in preference to a bare `nullable` when absence is genuinely meaningful to you elsewhere; the schema then states what your validator does rather than what one provider demands. **The option's name is not the wire spelling.** It emits the draft-07 union `type: ['string', 'null']`, **not** the OpenAPI-3.0 keyword `nullable: true` — which OpenAI ignores. Gemini wants the other one, and the Gemini adapter in `@fgv/ts-extras` translates; nothing here emits `nullable` as a keyword. Distinct from [optional](../functions/optional.md), which is about a key being **absent**. The two compose as `optional(string({ nullable: true }))` — absent, or present and null, or present and a string. A nullable node's constraints apply to its non-null values only: `null` is accepted unconstrained. |
| <a id="property-title"></a> `title?` | `string` | A short title for the value, emitted as the JSON Schema `title` annotation. **Remarks** An **annotation**: emitted by `toJson()`, never enforced by the validator. |
