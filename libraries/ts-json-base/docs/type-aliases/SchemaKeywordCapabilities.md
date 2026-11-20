[Home](../README.md) > SchemaKeywordCapabilities

# Type Alias: SchemaKeywordCapabilities

A wire format's keyword-capability table: a rule for **every** keyword.

## Type

```typescript
type SchemaKeywordCapabilities = Readonly<Record<SchemaValidatingKeyword, SchemaKeywordRule> & Record<SchemaAnnotationKeyword, SchemaAnnotationRule>> & ISchemaShapeCapabilities
```
