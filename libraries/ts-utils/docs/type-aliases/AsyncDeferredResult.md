[Home](../README.md) > AsyncDeferredResult

# Type Alias: AsyncDeferredResult

A unit of asynchronous work, deferred so that a scheduler can decide when to start it.

## Type

```typescript
type AsyncDeferredResult = () => Promise<Result<T>>
```
