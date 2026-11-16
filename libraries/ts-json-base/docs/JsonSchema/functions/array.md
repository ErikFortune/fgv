[Home](../../README.md) > [JsonSchema](../README.md) > array

# Function: array

Creates a schema node for a JSON `array` whose elements all match `items`.

## Signature

```typescript
function array(items: S, opts: Pick<ISchemaOptions, "title" | "description" | "nullable"> & { default?: undefined; examples?: undefined; kind?: undefined } & { nullable: true } | ValidatedSchemaOptions<{ nullable: true }>): ISchemaValidator<Static<S>[] | null>
```
