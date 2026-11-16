[Home](../README.md) > SchemaPatternValidator

# Type Alias: SchemaPatternValidator

Compiles a server-supplied `pattern` for `fromJson`, or refuses it.

## Type

```typescript
type SchemaPatternValidator = (source: string) => Result<SchemaPatternPredicate>
```
