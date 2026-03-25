[Home](../../README.md) > [ResourceTree](../README.md) > isResourceTreeRootOrNodeInit

# Function: isResourceTreeRootOrNodeInit

Type guard to determine if an init object represents a branch or root with children.

## Signature

```typescript
function isResourceTreeRootOrNodeInit(init: ResourceTreeNodeInit<T> | IResourceTreeRootInit<T>): init is IResourceTreeBranchInit<T>
```
