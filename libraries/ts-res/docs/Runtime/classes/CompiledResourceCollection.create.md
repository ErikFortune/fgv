[Home](../../README.md) > [Runtime](../README.md) > [CompiledResourceCollection](./CompiledResourceCollection.md) > create

## CompiledResourceCollection.create() method

Creates a new Runtime.CompiledResourceCollection | CompiledResourceCollection object.

**Signature:**

```typescript
static create(params: ICompiledResourceCollectionCreateParams): Result<CompiledResourceCollection>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>ICompiledResourceCollectionCreateParams</td><td>Parameters to create a new Runtime.CompiledResourceCollection | CompiledResourceCollection.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[CompiledResourceCollection](../../classes/CompiledResourceCollection.md)&gt;

`Success` with the new Runtime.CompiledResourceCollection | CompiledResourceCollection object if successful,
or `Failure` with an error message if not.
