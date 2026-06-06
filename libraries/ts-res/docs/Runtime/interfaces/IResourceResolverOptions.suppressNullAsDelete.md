[Home](../../README.md) > [Runtime](../README.md) > [IResourceResolverOptions](./IResourceResolverOptions.md) > suppressNullAsDelete

## IResourceResolverOptions.suppressNullAsDelete property

Controls whether null values in resource composition should suppress properties
instead of setting them to null. When true, properties with null values from
higher-priority partial candidates will be omitted from the final composed resource.

**Signature:**

```typescript
suppressNullAsDelete: boolean;
```
