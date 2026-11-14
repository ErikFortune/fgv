[Home](../README.md) > string

# Function: string

Creates a schema node for a JSON `string`.

## Signature

```typescript
function string(opts: Pick<ISchemaOptions, "title" | "description" | "nullable"> & { default?: undefined; examples?: undefined; kind?: undefined } & Pick<IStringSchemaOptions, "format"> & { pattern?: undefined; minLength?: undefined; maxLength?: undefined } & { nullable: true } | ValidatedStringOptions<{ nullable: true }>): ISchemaValidator<string | null>
```
