[Home](../README.md) > [EditableCollection](./EditableCollection.md) > parse

## EditableCollection.parse() method

Parse content (auto-detecting format) and create an editable collection.
Tries JSON first if content looks like JSON, otherwise tries YAML with JSON fallback.

**Signature:**

```typescript
static parse(content: string, params: Omit<IEditableCollectionParams<T, TBaseId>, "initialItems">): Result<EditableCollection<T, TBaseId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>content</td><td>string</td><td>String content to parse (YAML or JSON)</td></tr>
<tr><td>params</td><td>Omit&lt;IEditableCollectionParams&lt;T, TBaseId&gt;, "initialItems"&gt;</td><td>Collection creation parameters (without initialItems)</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditableCollection](EditableCollection.md)&lt;T, TBaseId&gt;&gt;

Result containing EditableCollection or failure
