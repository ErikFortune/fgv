[Home](../../README.md) > [JsonSchema](../README.md) > numberEnumOf

# Function: numberEnumOf

Creates a schema node for a closed set of numbers (pydantic `Literal[1.5, 2]`).

## Signature

```typescript
function numberEnumOf(values: readonly T[], opts: ISchemaOptions & { nullable: true }): Result<ISchemaValidator<T | null>>
```
