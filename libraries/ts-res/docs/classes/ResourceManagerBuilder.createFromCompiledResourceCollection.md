[Home](../README.md) > [ResourceManagerBuilder](./ResourceManagerBuilder.md) > createFromCompiledResourceCollection

## ResourceManagerBuilder.createFromCompiledResourceCollection() method

Creates a new Resources.ResourceManagerBuilder | ResourceManagerBuilder from a
ResourceJson.Compiled.ICompiledResourceCollection | compiled resource collection.
This method reconstructs an exactly equivalent builder where all qualifier, condition,
condition set, and decision indices match the original compiled collection.

**Signature:**

```typescript
static createFromCompiledResourceCollection(compiledCollection: ICompiledResourceCollection, systemConfig: SystemConfiguration): Result<ResourceManagerBuilder>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>compiledCollection</td><td>ICompiledResourceCollection</td><td>The compiled resource collection to reconstruct from.</td></tr>
<tr><td>systemConfig</td><td>SystemConfiguration</td><td>The system configuration containing qualifiers and resource types.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ResourceManagerBuilder](ResourceManagerBuilder.md)&gt;

`Success` with the new manager if successful, or `Failure` with an error message if not.
