[Home](../README.md) > [ResourceManagerBuilder](./ResourceManagerBuilder.md) > getAllBuiltResources

## ResourceManagerBuilder.getAllBuiltResources() method

Gets a read-only array of all Resources.Resource | built resources in the manager.

**Signature:**

```typescript
getAllBuiltResources(): Result<readonly Resource[]>;
```

**Returns:**

Result&lt;readonly [Resource](Resource.md)[]&gt;

`Success` with an array of resources if successful, or `Failure` with an error message if not.
