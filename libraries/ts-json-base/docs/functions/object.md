[Home](../README.md) > object

# Function: object

A helper function to create a JsonCompatible.ObjectValidator | JSON-compatible ObjectValidator<T, TC> which validates a supplied `unknown` value to a valid JsonCompatibleType | JsonCompatible value.

## Signature

```typescript
function object(properties: Validation.Classes.FieldValidators<JsonCompatibleType<T>, TC>, params: Omit<ObjectValidatorConstructorParams<JsonCompatibleType<T>, TC>, "fields">): ObjectValidator<T, TC>
```
