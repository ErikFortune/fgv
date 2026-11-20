[Home](../README.md) > object

# Function: object

Creates a schema node for an **open** JSON `object`: typed declared properties, plus any
undeclared properties, which are carried through as `JsonValue`.

## Signature

```typescript
function object(properties: P, opts: Pick<ISchemaOptions, "title" | "description" | "nullable"> & { default?: undefined; examples?: undefined; kind?: undefined } & Pick<IObjectSchemaOptions, "additionalProperties"> & { additionalProperties: true; nullable: true } | ValidatedSchemaOptions<{ additionalProperties: true; nullable: true }>): ISchemaValidator<OpenObjectStatic<P> | null>
```
