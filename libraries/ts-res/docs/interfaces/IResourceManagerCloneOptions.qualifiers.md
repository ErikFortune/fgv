[Home](../README.md) > [IResourceManagerCloneOptions](./IResourceManagerCloneOptions.md) > qualifiers

## IResourceManagerCloneOptions.qualifiers property

Optional qualifier collector to use for the cloned manager.
If not provided, uses the same qualifiers as the original manager.
This allows creating clones with different qualifier configurations.

**Signature:**

```typescript
readonly qualifiers: IReadOnlyQualifierCollector;
```
