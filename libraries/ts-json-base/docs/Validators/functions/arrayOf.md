[Home](../../README.md) > [Validators](../README.md) > arrayOf

# Function: arrayOf

A helper function to create a JsonCompatible.ArrayValidator | JSON-compatible ArrayValidator<T, TC> which validates a supplied `unknown` value to a valid JsonCompatibleType | JsonCompatible value.

## Signature

```typescript
function arrayOf(validateElement: Validator<T, TC>, params: Omit<ArrayValidatorConstructorParams<JsonCompatibleType<T>, TC>, "validateElement">): ArrayValidator<T, TC>
```
