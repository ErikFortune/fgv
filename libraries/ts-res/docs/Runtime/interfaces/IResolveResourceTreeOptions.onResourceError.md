[Home](../../README.md) > [Runtime](../README.md) > [IResolveResourceTreeOptions](./IResolveResourceTreeOptions.md) > onResourceError

## IResolveResourceTreeOptions.onResourceError property

Controls how errors are handled when resolving individual resources in the tree.
- 'fail': Aggregate all errors and fail if any resource fails to resolve
- 'ignore': Skip failed resources and omit them from the result
- callback: Custom error handler that can provide alternate values or propagate errors

**Signature:**

```typescript
onResourceError: "fail" | "ignore" | ResourceErrorHandler;
```
