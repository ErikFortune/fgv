[Home](../../README.md) > [JsonSchema](../README.md) > boolean

# Function: boolean

Creates a schema node for a JSON `boolean`.

## Signature

```typescript
function boolean(opts: Pick<ISchemaOptions, "title" | "description" | "nullable"> & { default?: undefined; examples?: undefined; kind?: undefined } & { nullable: true } | ValidatedSchemaOptions<{ nullable: true }>): ISchemaValidator<boolean | null>
```
