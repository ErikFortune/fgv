[Home](../../README.md) > [Runtime](../README.md) > IReadOnlyResourceTreeNode

# Type Alias: IReadOnlyResourceTreeNode

Union type representing any node in the resource tree, which can be a leaf or a branch.
This allows for flexible handling of different node types in the tree structure.

## Type

```typescript
type IReadOnlyResourceTreeNode = IReadOnlyResourceTreeLeaf<T> | IReadOnlyResourceTreeBranch<T>
```
