[Home](../README.md) > [ResourceManagerBuilder](./ResourceManagerBuilder.md) > getCompiledResourceCollection

## ResourceManagerBuilder.getCompiledResourceCollection() method

Gets a compiled resource collection from the current state of the resource manager builder.
This method generates an optimized, index-based representation of all resources, conditions,
and decisions that can be used for serialization or efficient runtime processing.

**Signature:**

```typescript
getCompiledResourceCollection(options?: ICompiledResourceOptions): Result<ICompiledResourceCollection>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>ICompiledResourceOptions</td><td>Optional compilation options controlling the output format.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ICompiledResourceCollection](../interfaces/ICompiledResourceCollection.md)&gt;

Success with the compiled resource collection if successful, Failure otherwise.
