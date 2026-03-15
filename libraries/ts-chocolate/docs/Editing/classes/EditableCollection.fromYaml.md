[Home](../../README.md) > [Editing](../README.md) > [EditableCollection](./EditableCollection.md) > fromYaml

## EditableCollection.fromYaml() method

Parse a YAML string and create an editable collection.

**Signature:**

```typescript
static fromYaml(content: string, params: Omit<IEditableCollectionParams<T, TBaseId>, "initialItems">): Result<EditableCollection<T, TBaseId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>content</td><td>string</td><td>YAML string content</td></tr>
<tr><td>params</td><td>Omit&lt;IEditableCollectionParams&lt;T, TBaseId&gt;, "initialItems"&gt;</td><td>Collection creation parameters (without initialItems)</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditableCollection](../../classes/EditableCollection.md)&lt;T, TBaseId&gt;&gt;

Result containing EditableCollection or failure
