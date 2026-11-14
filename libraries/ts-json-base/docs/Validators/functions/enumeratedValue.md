[Home](../../README.md) > [Validators](../README.md) > enumeratedValue

# Function: enumeratedValue

Helper function to create a `Validator` which validates `unknown` to one of a set of
supplied enumerated values. Anything else fails.

## Signature

```typescript
function enumeratedValue(values: readonly T[], message: string): Validator<T, IJsonValidatorContext | readonly T[]>
```
