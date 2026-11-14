[Home](../../README.md) > [Runtime](../README.md) > ResourceErrorHandler

# Type Alias: ResourceErrorHandler

Type for handling resource resolution errors during tree traversal.
The handler receives the resource that failed to resolve, the error message, and the resolver for recovery attempts.
It can return:
- Success(undefined) to omit the property from the result
- Success(value) to use an alternate value
- Failure to propagate the error

## Type

```typescript
type ResourceErrorHandler = (resource: IResource, message: string, resolver: ResourceResolver) => Result<JsonValue | undefined>
```
