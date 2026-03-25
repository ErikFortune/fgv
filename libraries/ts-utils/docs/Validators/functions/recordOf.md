[Home](../../README.md) > [Validators](../README.md) > recordOf

# Function: recordOf

A helper function to create a Validation.Validator | Validator which validates the `string`-keyed properties
using a supplied Validation.Validator | Validator<T, TC> to produce a `Record<TK, T>`.

## Signature

```typescript
function recordOf(validator: Validator<T, TC>, options: IRecordOfValidatorOptions<TK, TC>): Validator<Record<TK, T>, TC>
```
