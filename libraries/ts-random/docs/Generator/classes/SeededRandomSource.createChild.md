[Home](../../README.md) > [Generator](../README.md) > [SeededRandomSource](./SeededRandomSource.md) > createChild

## SeededRandomSource.createChild() method

Creates a child random source with a label.

**Signature:**

```typescript
createChild(label: string): SeededRandomSource;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>label</td><td>string</td><td>The label for the child.</td></tr>
</tbody></table>

**Returns:**

[SeededRandomSource](../../classes/SeededRandomSource.md)

A new seeded random source with a hashed state and label.
