[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / adaptSchemaKeywords

# Function: adaptSchemaKeywords()

> **adaptSchemaKeywords**(`schema`, `capabilities`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../../type-aliases/JsonValue.md)\>

Adapts a wire schema's constraint and annotation keywords, and its non-string enums and untyped
nodes, to one provider's documented support, per `capabilities`: each keyword is passed,
translated, folded into the node's description, or (an annotation) dropped; a non-string `enum`
is passed or folded; and a node with no `type` is passed or refused.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `schema` | [`JsonValue`](../../../type-aliases/JsonValue.md) | A wire schema, typically `schema.toJson()`. |
| `capabilities` | [`SchemaKeywordCapabilities`](../type-aliases/SchemaKeywordCapabilities.md) | The target wire format's keyword-capability table. |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`JsonValue`](../../../type-aliases/JsonValue.md)\>

The adapted schema — the input is not modified — or a `Failure` naming the path of a
node the wire cannot carry.

## Remarks

**Folding loosens the wire, never the validator.** A folded keyword is removed from the node and
restated in deterministic text appended to its `description` — see `foldedKeywordsText`. The
schema's validator still enforces it, so the validator stays authoritative: a model that ignores
a folded constraint gets a correctable validation error on a tool call, and a validation failure
on a structured-output reply. That is why folding is always safe, and why a capability table
should fold anything not verified. Dropping is safe for the same reason, and is allowed only for
annotations, which constrain nothing.

**A node with no `type` is never given one.** Where the table refuses it, adaptation fails with
the node's JSON Pointer path: inventing a `type` would narrow what the model may send below what
the validator accepts, which is the one direction an adaptation must never move. A schema-valued
`additionalProperties` with no `type` is exempt — it says "any value" for the undeclared keys,
which a wire that drops or ignores `additionalProperties` already means.

Walks the schema grammar `toJson()` emits — a node's `properties` values, `items` and
schema-valued `additionalProperties` are nodes and are adapted; every other value, `default`,
`examples` and `enum` among them, is data and is copied untouched. A property *named* like a
keyword is a name, not a keyword. A value that is not an object is returned as it is.
