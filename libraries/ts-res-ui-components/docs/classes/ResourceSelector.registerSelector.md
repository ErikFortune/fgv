[Home](../README.md) > [ResourceSelector](./ResourceSelector.md) > registerSelector

## ResourceSelector.registerSelector() method

Register a new selector type that can be used in grid configurations.

**Signature:**

```typescript
registerSelector(type: string, handler: SelectorHandler): void;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>type</td><td>string</td><td>Unique identifier for the selector type</td></tr>
<tr><td>handler</td><td>SelectorHandler</td><td>Function that implements the selection logic</td></tr>
</tbody></table>

**Returns:**

void
