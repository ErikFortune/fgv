[Home](../README.md) > populateObject

# Function: populateObject

Populates an an object based on a prototype full of field initializers that return Result | Result<T[key]>.
Returns Success with the populated object if all initializers succeed, or Failure with a
concatenated list of all error messages.

## Signature

```typescript
function populateObject(initializers: FieldInitializers<T>, options: PopulateObjectOptions<T>, aggregatedErrors: IMessageAggregator): Result<T>
```
