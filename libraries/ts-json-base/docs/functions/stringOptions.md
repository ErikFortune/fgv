[Home](../README.md) > stringOptions

# Function: stringOptions

Checks `string` options for coherence and returns them as
`validated options` — the only way length keywords
reach the `string` factory.

## Signature

```typescript
function stringOptions(opts: T & Record<Exclude<keyof T, keyof IStringSchemaOptions>, never>): Result<ValidatedStringOptions<T>>
```
