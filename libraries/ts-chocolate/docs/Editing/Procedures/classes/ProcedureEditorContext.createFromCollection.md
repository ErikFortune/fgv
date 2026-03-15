[Home](../../../README.md) > [Editing](../../README.md) > [Procedures](../README.md) > [ProcedureEditorContext](./ProcedureEditorContext.md) > createFromCollection

## ProcedureEditorContext.createFromCollection() method

Create a procedure editor context from a collection.

**Signature:**

```typescript
static createFromCollection(collection: EditableCollection<IProcedureEntity, BaseProcedureId>): Result<ProcedureEditorContext>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collection</td><td>EditableCollection&lt;IProcedureEntity, BaseProcedureId&gt;</td><td>Mutable collection of procedures</td></tr>
</tbody></table>

**Returns:**

Result&lt;[ProcedureEditorContext](../../../classes/ProcedureEditorContext.md)&gt;

Result containing the editor context or failure
