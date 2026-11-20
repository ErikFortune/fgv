[Home](../README.md) > StringOneOf

# Type Alias: StringOneOf

Union of all string values in an array/tuple type, preserving literal types if possible.
If T is not an array/tuple, results in `never`.

## Type

```typescript
type StringOneOf = Extract<OneOf<T>, string>
```
