[Home](../README.md) > Simplify

# Type Alias: Simplify

Flattens an intersection of object types into a single object type for readable derived types.

## Type

```typescript
type Simplify = { [K in keyof T]: T[K] } & {}
```
