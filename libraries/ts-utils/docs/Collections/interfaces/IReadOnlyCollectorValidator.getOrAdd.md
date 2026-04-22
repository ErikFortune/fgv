[Home](../../README.md) > [Collections](../README.md) > [IReadOnlyCollectorValidator](./IReadOnlyCollectorValidator.md) > getOrAdd

## IReadOnlyCollectorValidator.getOrAdd() method

Gets an existing item with a key matching the supplied key, or adds a new item to the collector
using a factory callback if no item with that key exists.

**Signature:**

```typescript
getOrAdd(key: string, factory: ResultMapValueFactory<CollectibleKey<TITEM>, TITEM>): DetailedResult<TITEM, CollectorResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>string</td><td>The weakly-typed key of the item to get or add.</td></tr>
<tr><td>factory</td><td>ResultMapValueFactory&lt;CollectibleKey&lt;TITEM&gt;, TITEM&gt;</td><td>The factory callback to create the item.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../../type-aliases/DetailedResult.md)&lt;TITEM, [CollectorResultDetail](../../type-aliases/CollectorResultDetail.md)&gt;

Returns DetailedSuccess | Success with the item stored in the collector -
detail `exists` indicates that an existing item was returned and detail `added` indicates
that the item was added. Returns DetailedFailure | Failure with an error and
appropriate detail if the item could not be added.
