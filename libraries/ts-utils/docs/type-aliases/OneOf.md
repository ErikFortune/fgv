[Home](../README.md) > OneOf

# Type Alias: OneOf

Union of all values in an array/tuple type, preserving literal types if possible.
If T is not an array/tuple, results in `never`.

## Type

```typescript
type OneOf = T extends readonly unknown[] ? T[number] : never
```
