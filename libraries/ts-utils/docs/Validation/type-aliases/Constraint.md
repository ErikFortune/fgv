[Home](../../README.md) > [Validation](../README.md) > Constraint

# Type Alias: Constraint

A Validation.Constraint | Constraint<T> function returns
`true` if the supplied value meets the constraint. Can return
Failure with an error message or simply return `false`
for a default message.

## Type

```typescript
type Constraint = (val: T) => boolean | Failure<T>
```
