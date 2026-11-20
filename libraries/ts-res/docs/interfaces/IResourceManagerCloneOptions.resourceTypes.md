[Home](../README.md) > [IResourceManagerCloneOptions](./IResourceManagerCloneOptions.md) > resourceTypes

## IResourceManagerCloneOptions.resourceTypes property

Optional resource type collector to use for the cloned manager.
If not provided, uses the same resource types as the original manager.
This allows creating clones with different resource type configurations.

**Signature:**

```typescript
readonly resourceTypes: ReadOnlyResourceTypeCollector;
```
