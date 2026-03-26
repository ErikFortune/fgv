[Home](../../README.md) > [Runtime](../README.md) > [IResolveResourceTreeOptions](./IResolveResourceTreeOptions.md) > onEmptyBranch

## IResolveResourceTreeOptions.onEmptyBranch property

Controls how empty branch nodes are handled during tree composition.
- 'allow': Include empty branches as empty objects in the result
- 'omit': Exclude empty branches from the parent object
- callback: Custom handler that can provide alternate values or recovery logic

**Signature:**

```typescript
onEmptyBranch: "omit" | EmptyBranchHandler | "allow";
```
