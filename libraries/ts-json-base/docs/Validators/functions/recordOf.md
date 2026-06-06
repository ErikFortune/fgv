[Home](../../README.md) > [Validators](../README.md) > recordOf

# Function: recordOf

A helper function to create a JsonCompatible.RecordValidator | JSON-compatible RecordValidator<T, TC, TK> which validates a supplied `unknown` value
to a valid JsonCompatibleType | JsonCompatible value.

## Signature

```typescript
function recordOf(validateElement: Validator<T, TC>, options: IRecordOfValidatorOptions<TK, TC>): RecordValidator<T, TC, TK>
```
