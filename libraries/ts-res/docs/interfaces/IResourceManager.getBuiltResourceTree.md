[Home](../README.md) > [IResourceManager](./IResourceManager.md) > getBuiltResourceTree

## IResourceManager.getBuiltResourceTree() method

Gets a resource tree built from the resources in this resource manager.

**Signature:**

```typescript
getBuiltResourceTree(): Result<IReadOnlyResourceTreeRoot<TR>>;
```

**Returns:**

Result&lt;[IReadOnlyResourceTreeRoot](IReadOnlyResourceTreeRoot.md)&lt;TR&gt;&gt;

Result containing the resource tree root, or failure if tree construction fails
