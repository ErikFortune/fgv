[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / IStringSchemaOptions

# Interface: IStringSchemaOptions

Options for the `string` factory.

## Remarks

`minLength`, `maxLength` and `pattern` are **validating**; `format` is an **annotation**. They
reach the factory only through `stringOptions`, which refuses a
length that is not a non-negative integer, `minLength` greater than `maxLength`, and a `pattern`
that is not a `RegExp` whose only flag is `u`.

## Extends

- [`ISchemaOptions`](ISchemaOptions.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-default"></a> `default?` | [`JsonValue`](../../../type-aliases/JsonValue.md) | The value a consumer should assume when none is supplied, emitted as the JSON Schema `default` annotation. **Remarks** An **annotation**: emitted, never enforced, and never applied. The validator does not substitute it for a missing value. It must be a JSON value, so it reaches a factory only through validated options, which refuse one that is not. It is deliberately **not** checked against the node: JSON Schema does not require a `default` to validate, and checking it would refuse schemas servers already send. |
| <a id="property-description"></a> `description?` | `string` | Optional human-readable description emitted into the wire JSON Schema. |
| <a id="property-examples"></a> `examples?` | readonly [`JsonValue`](../../../type-aliases/JsonValue.md)[] | Example values, emitted as the JSON Schema `examples` annotation. **Remarks** An **annotation**, under the same rules as `default`: each member must be a JSON value, and none is checked against the node. |
| <a id="property-format"></a> `format?` | `string` | A semantic format such as `'date-time'` or `'email'`, emitted as the JSON Schema `format` annotation. **Remarks** An **annotation**: emitted, never enforced, and not checked against any list. Format vocabularies differ between providers and drafts, so enforcing one would refuse values another accepts. Provider adapters in `@fgv/ts-extras` fold a format a provider does not document into the description rather than sending it. |
| <a id="property-maxlength"></a> `maxLength?` | `number` | The string must have at most this many characters, counted in code points. |
| <a id="property-minlength"></a> `minLength?` | `number` | The string must have at least this many characters. **Remarks** Length is counted in Unicode code points, as JSON Schema specifies — not UTF-16 code units — so an astral character such as an emoji counts once. |
| <a id="property-nullable"></a> `nullable?` | `boolean` | When `true`, the value may also be `null`: the derived static type widens to `T \| null`, the validator accepts `null`, and the wire schema declares a union `type` (`['string', 'null']`). **Remarks** **This is how you express an absent-able field to a provider that requires every property to be required.** OpenAI's strict structured output rejects a schema with any property missing from `required`, so `optional(...)` is unsendable there — see `hasOptionalProperties` in `@fgv/ts-extras`, which refuses rather than relocating the failure into a provider 400. A required-and-nullable property is the sanctioned spelling, and because the schema *is* the validator, the wire shape and the check cannot disagree about it. **If the field is genuinely absent-able *and* `null`-able, say both:** `optional(string({ nullable: true }))` accepts absent, `null`, or a value. That composition is what `@fgv/ts-extras`' `adaptOptionalToNullable` looks for — on a format requiring every property to be required, it drops the optionality for the wire, which is safe precisely because the authored schema already accepts the `null` the model will then have to send. Reach for it in preference to a bare `nullable` when absence is genuinely meaningful to you elsewhere; the schema then states what your validator does rather than what one provider demands. **The option's name is not the wire spelling.** It emits the draft-07 union `type: ['string', 'null']`, **not** the OpenAPI-3.0 keyword `nullable: true` — which OpenAI ignores. Gemini wants the other one, and the Gemini adapter in `@fgv/ts-extras` translates; nothing here emits `nullable` as a keyword. Distinct from [optional](../functions/optional.md), which is about a key being **absent**. The two compose as `optional(string({ nullable: true }))` — absent, or present and null, or present and a string. A nullable node's constraints apply to its non-null values only: `null` is accepted unconstrained. |
| <a id="property-pattern"></a> `pattern?` | `RegExp` | A regular expression the string must match — the host's own, and therefore trusted. **Remarks** **Validating**: the derived validator enforces it and `toJson()` emits `pattern: <source>`. It is a `RegExp` rather than a source string so that the host compiles it — and owns its cost — and this package never turns a string into a regular expression. **Write it with exactly the `u` flag: `/^[a-z]+$/u`.** A JSON Schema `pattern` is an ECMA-262 regular expression built with `u`, and **unanchored** (write `^…$` to match the whole string). The wire carries only the source, so `stringOptions` refuses a `RegExp` with any other flag set (`g`, `i`, `m`, `s`, `y`, `d`, `v`) or without `u`: only then does the `RegExp` mean exactly what the wire states, and it is enforced as written, never recompiled. Its source and flags are read through the built-in accessors and it is matched with the built-in `exec`, so a subclass overriding them changes neither the wire nor the check. Do not re-initialise it afterwards with `compile()`: a node then fails every value closed rather than enforcing a pattern the wire does not state. **The wire receives ECMAScript source.** Provider engines implement dialects of it — some reject lookarounds or backreferences, and some anchor implicitly — so the provider adapters in `@fgv/ts-extras` send `pattern` only where the provider documents it, and fold it into the description elsewhere. Folding loosens only the wire; the validator still enforces the pattern. A schema read with `fromJson` never carries a `RegExp`: a server-supplied pattern is compiled, if at all, by the caller's `patternValidator` (see `IFromJsonOptions`). |
| <a id="property-title"></a> `title?` | `string` | A short title for the value, emitted as the JSON Schema `title` annotation. **Remarks** An **annotation**: emitted by `toJson()`, never enforced by the validator. |
