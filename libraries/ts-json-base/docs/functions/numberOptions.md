[Home](../README.md) > numberOptions

# Function: numberOptions

Checks `number` options for coherence and returns them as
`validated options` — the only way range keywords reach
the `number` factory.

## Signature

```typescript
function numberOptions(opts: T & Record<Exclude<keyof T, keyof INumberSchemaOptions>, never>): Result<ValidatedNumberOptions<T>>
```
