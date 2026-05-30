[Home](../../README.md) > [Runtime](../README.md) > EmptyBranchHandler

# Type Alias: EmptyBranchHandler

Type for handling empty branch nodes during tree composition.
The handler receives the branch node, names of failed children, and the resolver for recovery attempts.
It can return:
- Success(undefined) to omit the branch from the result
- Success(value) to use an alternate value for the branch
- Failure to propagate the error

## Type

```typescript
type EmptyBranchHandler = (branchNode: IReadOnlyResourceTreeNode<IResource>, failedChildNames: string[], resolver: ResourceResolver) => Result<JsonValue | undefined>
```
