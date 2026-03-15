[Home](../README.md) > [PersistedEditableCollection](./PersistedEditableCollection.md) > delete

## PersistedEditableCollection.delete() method

Delete an item from the collection.

Delegates to the underlying EditableCollection.delete | EditableCollection.delete().
When auto-persist is enabled, triggers PersistedEditableCollection.save | save()
after the mutation.

**Signature:**

```typescript
delete(key: TBaseId): DetailedResult<T, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>TBaseId</td><td>Base entity ID to delete</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;T, ResultMapResultDetail&gt;

The delete result from the underlying collection
