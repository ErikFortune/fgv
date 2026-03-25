[Home](../README.md) > [KeyValueConverters](./KeyValueConverters.md) > convertEntry

## KeyValueConverters.convertEntry() method

Converts a supplied unknown to a valid entry of type `[<TK>, <TV>]`.

**Signature:**

```typescript
convertEntry(entry: unknown): DetailedResult<KeyValueEntry<TK, TV>, ResultMapResultDetail>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>entry</td><td>unknown</td><td>The unknown to be converted.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../type-aliases/DetailedResult.md)&lt;[KeyValueEntry](../type-aliases/KeyValueEntry.md)&lt;TK, TV&gt;, [ResultMapResultDetail](../type-aliases/ResultMapResultDetail.md)&gt;

`Success` with the converted entry and 'success' detail if the entry
is valid, or `Failure` with an error message and 'invalid-key' or 'invalid-value' detail if
the entry is invalid
