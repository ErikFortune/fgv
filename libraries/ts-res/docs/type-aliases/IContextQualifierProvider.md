[Home](../README.md) > IContextQualifierProvider

# Type Alias: IContextQualifierProvider

Union type for context qualifier providers that can be either read-only or mutable.
Provides compile-time type discrimination via the `mutable` property.

## Type

```typescript
type IContextQualifierProvider = IReadOnlyContextQualifierProvider | IMutableContextQualifierProvider
```
