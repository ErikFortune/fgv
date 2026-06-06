[Home](../README.md) > object

# Function: object

Creates a schema node for a JSON `object` with a fixed set of typed properties.

## Signature

```typescript
function object(properties: P, opts: IObjectSchemaOptions): ISchemaValidator<{ [K in string | number | symbol]: ({ [K in string | number | symbol]: Static<P[K]> } & { [K in string | number | symbol]?: OptionalPropertyStatic<P[K]> })[K] }>
```
