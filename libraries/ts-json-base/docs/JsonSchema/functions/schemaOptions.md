[Home](../../README.md) > [JsonSchema](../README.md) > schemaOptions

# Function: schemaOptions

Checks the annotations every node carries and returns them as
`validated options` — the way to give a node a
`default` or `examples`.

## Signature

```typescript
function schemaOptions(opts: T & Record<Exclude<keyof T, keyof IObjectSchemaOptions>, never>): Result<ValidatedSchemaOptions<T>>
```
