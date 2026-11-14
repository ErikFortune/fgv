[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / SchemaPatternValidator

# Type Alias: SchemaPatternValidator

> **SchemaPatternValidator** = (`source`) => [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`SchemaPatternPredicate`](SchemaPatternPredicate.md)\>

Compiles a server-supplied `pattern` for `fromJson`, or refuses it.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | `string` |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`SchemaPatternPredicate`](SchemaPatternPredicate.md)\>

## Remarks

Called for each string node carrying `pattern`, with the source exactly as the schema states it —
again for the same node when a nullable `anyOf`/`oneOf` or a `$ref` with annotations re-reads it,
so it should be cheap to call twice (or cache by source).
A `Failure` refuses the whole schema, with the node's path and the validator's message. On
success, the returned predicate is what the node's validator calls on every string — so it must be
safe to run on any model-supplied string; a backtracking `RegExp` built from the source is
**not**. A predicate that throws, or returns anything but `true`, fails the value.

The node emits the source unchanged, and provider wires read it as an ECMA-262 pattern, so a
validator built on another engine (RE2, say) should refuse what it would read differently.
