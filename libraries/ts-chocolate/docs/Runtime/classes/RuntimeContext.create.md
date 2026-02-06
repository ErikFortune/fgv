[Home](../../README.md) > [Runtime](../README.md) > [RuntimeContext](./RuntimeContext.md) > create

## RuntimeContext.create() method

Creates a RuntimeContext with a new or default ChocolateEntityLibrary.
This is the primary factory method for most use cases.

**Signature:**

```typescript
static create(params?: IRuntimeContextCreateParams): Result<RuntimeContext>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IRuntimeContextCreateParams</td><td>Optional parameters for library and caching</td></tr>
</tbody></table>

**Returns:**

Result&lt;[RuntimeContext](../../classes/RuntimeContext.md)&gt;

Success with RuntimeContext, or Failure if library creation fails
