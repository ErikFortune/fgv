[Home](../README.md) > [Normalizer](./Normalizer.md) > normalizeEntries

## Normalizer.normalizeEntries() method

Normalizes an array of object property entries (e.g. as returned by `Object.entries()`).

**Signature:**

```typescript
normalizeEntries(entries: Iterable<Entry<T>>): Entry<T>[];
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>entries</td><td>Iterable&lt;Entry&lt;T&gt;&gt;</td><td>The entries to be normalized.</td></tr>
</tbody></table>

**Returns:**

Entry&lt;T&gt;[]

A normalized sorted array of entries.
