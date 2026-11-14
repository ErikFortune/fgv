[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [JsonSchema](../README.md) / schemaConstraintKeywords

# Variable: schemaConstraintKeywords

> `const` **schemaConstraintKeywords**: readonly \[`"minimum"`, `"exclusiveMinimum"`, `"maximum"`, `"exclusiveMaximum"`, `"multipleOf"`, `"minLength"`, `"maxLength"`, `"pattern"`, `"format"`, `"title"`, `"default"`, `"examples"`\]

Every keyword whose provider support varies, and which `adaptSchemaKeywords` adapts: the
validating keywords, then the annotations.

## Remarks

The **single** list: `SchemaConstraintKeyword` is derived from it, the walker iterates it, and
the factories, `fromJson` and `toJson()` copy fields through its two validating subsets — so a
keyword cannot be known to one of them and missing from another (which, for the walker, would
send it raw to every provider).
