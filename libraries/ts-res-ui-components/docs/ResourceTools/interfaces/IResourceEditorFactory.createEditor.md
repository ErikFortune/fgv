[Home](../../README.md) > [ResourceTools](../README.md) > [IResourceEditorFactory](./IResourceEditorFactory.md) > createEditor

## IResourceEditorFactory.createEditor() method

Attempts to create a resource editor for the given resource.

**Signature:**

```typescript
createEditor(resourceId: string, resourceType: string, value: TV): ResourceEditorResult<T, TV>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>resourceId</td><td>string</td><td>The ID of the resource to edit</td></tr>
<tr><td>resourceType</td><td>string</td><td>The type/key of the resource</td></tr>
<tr><td>value</td><td>TV</td><td>The current value of the resource</td></tr>
</tbody></table>

**Returns:**

[ResourceEditorResult](../../type-aliases/ResourceEditorResult.md)&lt;T, TV&gt;

ResourceEditorResult indicating success/failure and the editor component or error message
