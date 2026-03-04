[Home](../README.md) > [PersistedEditableCollection](./PersistedEditableCollection.md) > set

## PersistedEditableCollection.set() method

Add or update an item in the collection.

Delegates to the underlying EditableCollection.set | EditableCollection.set().
When auto-persist is enabled, triggers PersistedEditableCollection.save | save()
after the mutation.

**Signature:**

```typescript
set(key: TBaseId, value: T): DetailedResult<T, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>TBaseId</td><td>Base entity ID</td></tr>
<tr><td>value</td><td>T</td><td>Entity value</td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;T, ResultMapResultDetail&gt;

The set result from the underlying collection
