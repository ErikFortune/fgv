[Home](../../README.md) > [Collections](../README.md) > [ConvertingCollectorValidator](./ConvertingCollectorValidator.md) > add

## ConvertingCollectorValidator.add() method

Adds an item to the collection, failing if a different item with the same key already exists. Note
that adding an object that is already in the collection again will succeed without updating the collection.

**Signature:**

```typescript
add(key: string, value: unknown): DetailedResult<TITEM, CollectorResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>string</td><td>The item to add.</td></tr>
<tr><td>value</td><td>unknown</td><td></td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../../type-aliases/DetailedResult.md)&lt;TITEM, [CollectorResultDetail](../../type-aliases/CollectorResultDetail.md)&gt;

Returns DetailedSuccess | Success with the item and detail `added` if it was added
or detail `exists` if the item was already in the map.  Returns DetailedFailure | Failure with
an error message and appropriate detail if the item could not be added.
