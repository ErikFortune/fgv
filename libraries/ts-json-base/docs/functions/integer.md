[Home](../README.md) > integer

# Function: integer

Creates a schema node for a JSON `integer`.

## Signature

```typescript
function integer(opts: Pick<ISchemaOptions, "title" | "description" | "nullable"> & { default?: undefined; examples?: undefined; kind?: undefined } & Pick<INumberSchemaOptions, "strict"> & { minimum?: undefined; exclusiveMinimum?: undefined; maximum?: undefined; exclusiveMaximum?: undefined; multipleOf?: undefined } & { nullable: true } | ValidatedIntegerOptions<{ nullable: true }>): ISchemaValidator<number | null>
```
