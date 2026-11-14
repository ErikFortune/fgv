[Home](../README.md) > [KeyValueConverters](./KeyValueConverters.md) > convertEntries

## KeyValueConverters.convertEntries() method

Converts a supplied iterable of unknowns to valid key-value pairs.

**Signature:**

```typescript
convertEntries(entries: Iterable<unknown>): Result<KeyValueEntry<TK, TV>[]>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>entries</td><td>Iterable&lt;unknown&gt;</td><td>The iterable of unknowns to be converted.</td></tr>
</tbody></table>

**Returns:**

[Result](../type-aliases/Result.md)&lt;[KeyValueEntry](../type-aliases/KeyValueEntry.md)&lt;TK, TV&gt;[]&gt;

`Success` with an array of converted key-value pairs if all entries are valid,
or `Failure` with an error message if any entry is invalid.
