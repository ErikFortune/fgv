[Home](../../README.md) > [Locations](../README.md) > [LocationEditorContext](./LocationEditorContext.md) > createFromCollection

## LocationEditorContext.createFromCollection() method

Create a location editor context from a collection.

**Signature:**

```typescript
static createFromCollection(collection: EditableCollection<ILocationEntity, BaseLocationId>): Result<LocationEditorContext>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>collection</td><td>EditableCollection&lt;ILocationEntity, BaseLocationId&gt;</td><td>Mutable collection of locations</td></tr>
</tbody></table>

**Returns:**

Result&lt;[LocationEditorContext](../../classes/LocationEditorContext.md)&gt;

Result containing the editor context or failure
