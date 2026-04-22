[Home](../../README.md) > [Collections](../README.md) > [ConvertingCollectorValidator](./ConvertingCollectorValidator.md) > add

## ConvertingCollectorValidator.add() method

Adds an item to the collector using the default factory at a specified key,
failing if an item with that key already exists.

**Signature:**

```typescript
add(key: string, value: unknown): DetailedResult<TITEM, CollectorResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>string</td><td>The weakly-typed key of the item to add.</td></tr>
<tr><td>value</td><td>unknown</td><td>The source representation of the item to be added.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../../type-aliases/DetailedResult.md)&lt;TITEM, [CollectorResultDetail](../../type-aliases/CollectorResultDetail.md)&gt;

Returns Success | Success with the item if it is added, or Failure | Failure with
an error if the item cannot be created and indexed.
