[Home](../../README.md) > [Validators](../README.md) > oneOf

# Function: oneOf

Helper function to create a Validation.Validator | Validator which validates one
of several possible validated values.

## Signature

```typescript
function oneOf(validators: Validator<T, TC>[], params: Omit<OneOfValidatorConstructorParams<T, TC>, "validators">): OneOfValidator<T, TC>
```
