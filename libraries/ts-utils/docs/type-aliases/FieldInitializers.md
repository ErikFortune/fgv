[Home](../README.md) > FieldInitializers

# Type Alias: FieldInitializers

String-keyed record of initialization functions to be passed to populateObject
or populateObject.

## Type

```typescript
type FieldInitializers = { [key in keyof T]: (state: Partial<T>) => Result<T[key]> }
```
