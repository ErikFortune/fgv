[Home](../../README.md) > [Editing](../README.md) > [EditableCollection](./EditableCollection.md) > createEditable

## EditableCollection.createEditable() method

Create a new editable collection.

**Signature:**

```typescript
static createEditable(params: IEditableCollectionParams<T, TBaseId>): Result<EditableCollection<T, TBaseId>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>params</td><td>IEditableCollectionParams&lt;T, TBaseId&gt;</td><td>Creation parameters</td></tr>
</tbody></table>

**Returns:**

Result&lt;[EditableCollection](../../classes/EditableCollection.md)&lt;T, TBaseId&gt;&gt;

Result containing the editable collection or failure
