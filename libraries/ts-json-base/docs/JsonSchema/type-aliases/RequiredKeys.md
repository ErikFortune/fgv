[Home](../../README.md) > [JsonSchema](../README.md) > RequiredKeys

# Type Alias: RequiredKeys

The keys of `P` whose schemas are required (i.e. not optional).

## Type

```typescript
type RequiredKeys = Exclude<keyof P, OptionalKeys<P>>
```
