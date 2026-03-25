[Home](../README.md) > IResultValueType

# Type Alias: IResultValueType

Type inference to determine the result type of an IResult.

## Type

```typescript
type IResultValueType = T extends IResult<infer TV> ? TV : never
```
