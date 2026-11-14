[Home](../README.md) > AsyncFieldInitializers

# Type Alias: AsyncFieldInitializers

String-keyed record of asynchronous initialization functions to be passed to
populateObjectAsync.

## Type

```typescript
type AsyncFieldInitializers = { [key in keyof T]: (state: Partial<T>) => Promise<Result<T[key]>> }
```
