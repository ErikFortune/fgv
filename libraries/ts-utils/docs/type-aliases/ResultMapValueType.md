[Home](../README.md) > ResultMapValueType

# Type Alias: ResultMapValueType

Type inference to determine the value type returned from a result-map style
`get` method.

## Type

```typescript
type ResultMapValueType = Exclude<IResultValueType<ReturnType<TCollection["get"]>>, undefined>
```
