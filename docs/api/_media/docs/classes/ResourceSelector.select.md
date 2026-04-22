[Home](../README.md) > [ResourceSelector](./ResourceSelector.md) > select

## ResourceSelector.select() method

Select resources based on the provided selector configuration.

**Signature:**

```typescript
select(selector: GridResourceSelector, resources: IProcessedResources): Result<string[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>selector</td><td>GridResourceSelector</td><td>Resource selector configuration</td></tr>
<tr><td>resources</td><td>IProcessedResources</td><td>Processed resources to select from</td></tr>
</tbody></table>

**Returns:**

[Result](../type-aliases/Result.md)&lt;string[]&gt;

Result containing array of selected resource IDs
