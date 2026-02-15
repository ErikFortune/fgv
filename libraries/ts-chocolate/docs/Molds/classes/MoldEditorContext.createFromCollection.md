[Home](../../README.md) > [Molds](../README.md) > [MoldEditorContext](./MoldEditorContext.md) > createFromCollection

## MoldEditorContext.createFromCollection() method

Create a mold editor context from a collection.

**Signature:**

```typescript
static createFromCollection(collection: EditableCollection<IMoldEntity, BaseMoldId>): Result<MoldEditorContext>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collection</td><td>EditableCollection&lt;IMoldEntity, BaseMoldId&gt;</td><td>Mutable collection of molds</td></tr>
</tbody></table>

**Returns:**

Result&lt;[MoldEditorContext](../../classes/MoldEditorContext.md)&gt;

Result containing the editor context or failure
