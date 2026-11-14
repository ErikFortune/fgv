[Home](../README.md) > SchemaValidatingKeyword

# Type Alias: SchemaValidatingKeyword

A validating keyword: enforced by the validator.

## Type

```typescript
type SchemaValidatingKeyword = StringOneOf<typeof schemaNumberConstraintKeywords> | StringOneOf<typeof schemaLengthConstraintKeywords> | StringOneOf<typeof schemaPatternConstraintKeywords>
```
