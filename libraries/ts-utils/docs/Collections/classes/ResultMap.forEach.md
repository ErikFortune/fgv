[Home](../../README.md) > [Collections](../README.md) > [ResultMap](./ResultMap.md) > forEach

## ResultMap.forEach() method

Calls a function for each entry in the map.

**Signature:**

```typescript
forEach(cb: ResultMapForEachCb<TK, TV>, arg?: unknown): void;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cb</td><td>ResultMapForEachCb&lt;TK, TV&gt;</td><td>The function to call for each entry.</td></tr>
<tr><td>arg</td><td>unknown</td><td>An optional argument to pass to the callback.</td></tr>
</tbody></table>

**Returns:**

void
