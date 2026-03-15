[Home](../../README.md) > [Editing](../README.md) > [EditableCollection](./EditableCollection.md) > add

## EditableCollection.add() method

Add item only if key doesn't exist.
Fails if collection is immutable.

**Signature:**

```typescript
add(key: TBaseId, value: T): DetailedResult<T, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>TBaseId</td><td></td></tr>
<tr><td>value</td><td>T</td><td></td></tr>
</tbody></table>

**Returns:**

DetailedResult&lt;T, ResultMapResultDetail&gt;
