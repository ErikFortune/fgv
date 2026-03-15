[Home](../../README.md) > [Editing](../README.md) > [EditableCollection](./EditableCollection.md) > update

## EditableCollection.update() method

Update item only if key exists.
Fails if collection is immutable.

**Signature:**

```typescript
update(key: TBaseId, value: T): DetailedResult<T, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>TBaseId</td><td></td></tr>
<tr><td>value</td><td>T</td><td></td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;T, ResultMapResultDetail&gt;
