[Home](../../README.md) > [Iana](../README.md) > datedRegistry

# Function: datedRegistry

Helper function which creates a converter that returns a validated Iana.Model.IDatedRegistry | DatedRegistry
containing entries of supplied template type `T`.

## Signature

```typescript
function datedRegistry(entryConverter: Converter<T, TC>): Converter<IDatedRegistry<T>, unknown>
```
