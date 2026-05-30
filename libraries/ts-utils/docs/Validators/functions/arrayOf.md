[Home](../../README.md) > [Validators](../README.md) > arrayOf

# Function: arrayOf

Helper function to create a Validation.Classes.ArrayValidator | ArrayValidator which
validates an array in place.

## Signature

```typescript
function arrayOf(validateElement: Validator<T, TC>, params: Omit<ArrayValidatorConstructorParams<T, TC>, "validateElement">): ArrayValidator<T, TC>
```
