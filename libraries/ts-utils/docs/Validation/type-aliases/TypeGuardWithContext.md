[Home](../../README.md) > [Validation](../README.md) > TypeGuardWithContext

# Type Alias: TypeGuardWithContext

A type guard function which validates a specific type, with an optional context
that can be used to shape the validation.

## Type

```typescript
type TypeGuardWithContext = (from: unknown, context?: TC) => from is T
```
