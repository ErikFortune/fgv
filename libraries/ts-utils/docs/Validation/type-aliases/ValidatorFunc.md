[Home](../../README.md) > [Validation](../README.md) > ValidatorFunc

# Type Alias: ValidatorFunc

Type for a validation function, which validates that a supplied `unknown`
value is a valid value of type `<T>`, possibly as influenced by
an optionally-supplied validation context of type `<TC>`.

## Type

```typescript
type ValidatorFunc = (from: unknown, context?: TC, self?: Validator<T, TC>) => boolean | Failure<T>
```
