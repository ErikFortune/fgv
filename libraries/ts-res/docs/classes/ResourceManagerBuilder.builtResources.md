[Home](../README.md) > [ResourceManagerBuilder](./ResourceManagerBuilder.md) > builtResources

## ResourceManagerBuilder.builtResources property

A read-only result map of all built resources, keyed by resource ID.
Resources are built on-demand when accessed and returns Results for error handling.

**Signature:**

```typescript
readonly builtResources: IReadOnlyValidatingResultMap<ResourceId, Resource>;
```
