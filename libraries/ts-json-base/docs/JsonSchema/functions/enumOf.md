[Home](../../README.md) > [JsonSchema](../README.md) > enumOf

# Function: enumOf

Creates a schema node for a closed set of string literals.

## Signature

```typescript
function enumOf(values: readonly T[], opts: Pick<ISchemaOptions, "title" | "description" | "nullable"> & { default?: undefined; examples?: undefined; kind?: undefined } & { nullable: true } | ValidatedSchemaOptions<{ nullable: true }>): ISchemaValidator<T | null>
```
