[Home](../README.md) > [IJsonReferenceMap](./IJsonReferenceMap.md) > keyIsInRange

## IJsonReferenceMap.keyIsInRange() method

Determine if a key might be valid for this map but does not determine if key actually
exists. Allows key range to be constrained.

**Signature:**

```typescript
keyIsInRange(key: string): boolean;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>string</td><td>The key to be tested.</td></tr>
</tbody></table>

**Returns:**

boolean

`true` if the key is in the valid range, `false` otherwise.
