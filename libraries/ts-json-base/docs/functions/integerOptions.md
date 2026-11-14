[Home](../README.md) > integerOptions

# Function: integerOptions

Checks `integer` options for coherence and returns them as
`validated options` — the only way range keywords
reach the `integer` factory.

## Signature

```typescript
function integerOptions(opts: T & Record<Exclude<keyof T, keyof INumberSchemaOptions>, never>): Result<ValidatedIntegerOptions<T>>
```
