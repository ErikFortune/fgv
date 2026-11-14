[Home](../../README.md) > [JsonSchema](../README.md) > number

# Function: number

Creates a schema node for a JSON `number`.

## Signature

```typescript
function number(opts: Pick<ISchemaOptions, "title" | "description" | "nullable"> & { default?: undefined; examples?: undefined; kind?: undefined } & Pick<INumberSchemaOptions, "strict"> & { minimum?: undefined; exclusiveMinimum?: undefined; maximum?: undefined; exclusiveMaximum?: undefined; multipleOf?: undefined } & { nullable: true } | ValidatedNumberOptions<{ nullable: true }>): ISchemaValidator<number | null>
```
