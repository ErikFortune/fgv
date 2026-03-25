[Home](../../README.md) > [Collections](../README.md) > [ConvertingCollectorValidator](./ConvertingCollectorValidator.md) > getOrAdd

## ConvertingCollectorValidator.getOrAdd() method

Gets an existing item with a key matching that of a supplied item, or adds the supplied
item to the collector if no item with that key exists.

**Signature:**

```typescript
getOrAdd(key: string, value: unknown): DetailedResult<TITEM, CollectorResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>string</td><td>The item to get or add.</td></tr>
<tr><td>value</td><td>unknown</td><td></td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../../type-aliases/DetailedResult.md)&lt;TITEM, [CollectorResultDetail](../../type-aliases/CollectorResultDetail.md)&gt;

Returns DetailedSuccess | Success with the item stored in the collector -
detail `exists` indicates that an existing item return and detail `added` indicates that the
item was added. Returns DetailedFailure | Failure with an error and appropriate
detail if the item could not be added.
