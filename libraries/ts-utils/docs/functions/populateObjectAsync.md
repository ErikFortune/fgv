[Home](../README.md) > populateObjectAsync

# Function: populateObjectAsync

Populates an object based on a prototype full of asynchronous field initializers that return
Result | Result<T[key]>.

## Signature

```typescript
function populateObjectAsync(initializers: AsyncFieldInitializers<T>, options: PopulateObjectOptions<T>, aggregatedErrors: IMessageAggregator): Promise<Result<T>>
```
