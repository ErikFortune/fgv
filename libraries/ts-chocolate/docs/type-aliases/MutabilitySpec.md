[Home](../README.md) > MutabilitySpec

# Type Alias: MutabilitySpec

Specifies which collections should be mutable.
- `true`: All collections are mutable.
- `false`: All collections are immutable.
- `ReadonlyArray<string>`: Only the specified collections are mutable, all others are immutable.
- `{ immutable: ReadonlyArray<string> }`: Only the specified collections are immutable, all others are mutable.

## Type

```typescript
type MutabilitySpec = boolean | ReadonlyArray<string> | { immutable: ReadonlyArray<string> }
```
