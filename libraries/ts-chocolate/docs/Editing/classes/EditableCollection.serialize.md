[Home](../../README.md) > [Editing](../README.md) > [EditableCollection](./EditableCollection.md) > serialize

## EditableCollection.serialize() method

Serialize collection to string based on format.

**Signature:**

```typescript
serialize(format: "json" | "yaml", options?: IExportOptions): Result<string>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>format</td><td>"json" | "yaml"</td><td>Export format ('yaml' or 'json')</td></tr>
<tr><td>options</td><td>IExportOptions</td><td>Optional export options</td></tr>
</tbody></table>

**Returns:**

Result&lt;string&gt;

Result containing serialized string or failure
