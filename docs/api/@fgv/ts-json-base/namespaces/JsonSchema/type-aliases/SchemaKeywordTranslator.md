[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / SchemaKeywordTranslator

# Type Alias: SchemaKeywordTranslator

> **SchemaKeywordTranslator** = (`node`) => [`JsonObject`](../../../interfaces/JsonObject.md) \| `undefined`

Rewrites a node to express one keyword in a provider's dialect.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `node` | [`JsonObject`](../../../interfaces/JsonObject.md) |

## Returns

[`JsonObject`](../../../interfaces/JsonObject.md) \| `undefined`

## Remarks

Called with a node carrying the keyword; returns the node with the keyword **removed** and an
exactly equivalent statement in its place, or `undefined` when no exact equivalent exists for
this node — in which case the keyword is folded. A translator must never return a looser or a
tighter statement than the one it replaces: the wire would then disagree with the validator.
