[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / schemaPatternConstraintKeywords

# Variable: schemaPatternConstraintKeywords

> `const` **schemaPatternConstraintKeywords**: readonly \[`"pattern"`\]

The regular-expression constraint keyword of a `string` node, in the order it is checked, emitted
and folded.

## Remarks

The wire receives the pattern's ECMAScript source, which JSON Schema reads as an unanchored
ECMA-262 regular expression with Unicode semantics. Provider engines implement dialects of it, so
a table passes `pattern` only where the provider documents the keyword with those semantics.
