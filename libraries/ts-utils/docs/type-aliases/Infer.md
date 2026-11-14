[Home](../README.md) > Infer

# Type Alias: Infer

Infers the type that will be returned by an instantiated converter. Works
for complex as well as simple types, including nested arrays.

## Type

```typescript
type Infer = TCONV extends Converter<infer TTO, unknown> ? InnerInferredType<TTO> : never
```
