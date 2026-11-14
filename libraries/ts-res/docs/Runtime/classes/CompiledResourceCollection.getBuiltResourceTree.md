[Home](../../README.md) > [Runtime](../README.md) > [CompiledResourceCollection](./CompiledResourceCollection.md) > getBuiltResourceTree

## CompiledResourceCollection.getBuiltResourceTree() method

Gets a resource tree built from the resources in this collection.
The tree provides hierarchical access to resources based on their ResourceId structure.
For example, resources with IDs like "app.messages.welcome" create a tree structure
where "app" and "messages" are branch nodes, and "welcome" is a leaf containing the resource.

String-based validation is available through the `children.validating` property,
allowing callers to use `tree.children.validating.getById(stringId)` for validated access.

Uses lazy initialization with caching for performance.

**Signature:**

```typescript
getBuiltResourceTree(): Result<ReadOnlyResourceTreeRoot<IResource>>;
```

**Returns:**

Result&lt;[ReadOnlyResourceTreeRoot](../../classes/ReadOnlyResourceTreeRoot.md)&lt;[IResource](../../interfaces/IResource.md)&gt;&gt;

Result containing the resource tree root, or failure if tree construction fails
