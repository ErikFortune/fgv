[Home](../../README.md) > [Collections](../README.md) > [ReadOnlyConvertingResultMap](./ReadOnlyConvertingResultMap.md) > forEach

## ReadOnlyConvertingResultMap.forEach() method

Calls a callback for each entry in the map with converted values.

**Signature:**

```typescript
forEach(cb: ResultMapForEachCb<TK, TTARGET>, thisArg?: unknown): void;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cb</td><td>ResultMapForEachCb&lt;TK, TTARGET&gt;</td><td>The callback to call for each entry.</td></tr>
<tr><td>thisArg</td><td>unknown</td><td>Optional `this` argument for the callback.</td></tr>
</tbody></table>

**Returns:**

void
