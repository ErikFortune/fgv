[Home](../README.md) > booleanEnumOf

# Function: booleanEnumOf

Creates a schema node for a closed set of booleans (a boolean `const`).

## Signature

```typescript
function booleanEnumOf(values: readonly T[], opts: ISchemaOptions & { nullable: true }): Result<ISchemaValidator<T | null>>
```
