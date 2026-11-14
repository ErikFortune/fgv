[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / SchemaAnnotationRule

# Type Alias: SchemaAnnotationRule

> **SchemaAnnotationRule** = [`SchemaKeywordRule`](SchemaKeywordRule.md) \| `"drop"`

What one wire format does with one annotation: any `SchemaKeywordRule`, or `'drop'` — removed
and not restated.

## Remarks

Only an annotation may be dropped: it constrains nothing, so removing it cannot make the wire
looser than the validator. A validating keyword is always passed, translated or folded.
