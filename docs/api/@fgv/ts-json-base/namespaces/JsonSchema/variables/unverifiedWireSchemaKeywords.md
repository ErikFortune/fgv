[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / unverifiedWireSchemaKeywords

# Variable: unverifiedWireSchemaKeywords

> `const` **unverifiedWireSchemaKeywords**: [`SchemaKeywordCapabilities`](../type-aliases/SchemaKeywordCapabilities.md)

The conservative table, for a wire whose support is undocumented: every keyword folds, except
`title` and `default`, which are dropped. A title restates the property name the model already
sees. A default folded into the description (`Default: 3.`) reads as though it were applied when
the field is omitted, and nothing applies it (the validator never substitutes a default), so
stating it would mislead the model about what an omitted field means. A non-string `enum` folds,
and a schema with no `type` is refused.
