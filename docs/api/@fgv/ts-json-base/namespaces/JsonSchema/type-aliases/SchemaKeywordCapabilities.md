[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / SchemaKeywordCapabilities

# Type Alias: SchemaKeywordCapabilities

> **SchemaKeywordCapabilities** = `Readonly`\<`Record`\<[`SchemaValidatingKeyword`](SchemaValidatingKeyword.md), [`SchemaKeywordRule`](SchemaKeywordRule.md)\> & `Record`\<[`SchemaAnnotationKeyword`](SchemaAnnotationKeyword.md), [`SchemaAnnotationRule`](SchemaAnnotationRule.md)\>\> & [`ISchemaShapeCapabilities`](../interfaces/ISchemaShapeCapabilities.md)

A wire format's keyword-capability table: a rule for **every** keyword.

## Remarks

Total, so a table that forgets a keyword — or a keyword added later — is a compile error rather
than a silent default. Build a table so that anything not verified against the provider's
documentation is `'fold'` (or, for an annotation, `'drop'`): folding is always safe (see
`adaptSchemaKeywords`), so an unverified `'pass'` is the only way a table can be wrong in a
harmful direction.
