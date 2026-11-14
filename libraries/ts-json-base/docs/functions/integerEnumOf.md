[Home](../README.md) > integerEnumOf

# Function: integerEnumOf

Creates a schema node for a closed set of integers (pydantic `Literal[1, 2]`).

## Signature

```typescript
function integerEnumOf(values: readonly T[], opts: ISchemaOptions & { nullable: true }): Result<ISchemaValidator<T | null>>
```
