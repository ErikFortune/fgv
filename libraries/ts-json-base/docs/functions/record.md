[Home](../README.md) > record

# Function: record

Creates a schema node for a JSON object used as a map: any keys, each value matching `values`
(pydantic `dict[str, T]`, zod `z.record(T)`).

## Signature

```typescript
function record(values: S & (undefined extends Static<S> ? never : unknown), opts: Pick<ISchemaOptions, "title" | "description" | "nullable"> & { default?: undefined; examples?: undefined; kind?: undefined } & { nullable: true } | ValidatedSchemaOptions<{ nullable: true }>): ISchemaValidator<Record<string, Static<S>> | null>
```
