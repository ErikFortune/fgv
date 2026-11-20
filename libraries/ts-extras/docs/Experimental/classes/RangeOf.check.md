[Home](../../README.md) > [Experimental](../README.md) > [RangeOf](./RangeOf.md) > check

## RangeOf.check() method

Checks if a supplied value is within this range.

**Signature:**

```typescript
check(t: T): "less" | "greater" | "included";
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>t</td><td>T</td><td>The value to be tested.</td></tr>
</tbody></table>

**Returns:**

"less" | "greater" | "included"

`'included'` if `t` falls within the range, `'less'` if `t` falls
below the minimum extent of the range and `'greater'` if `t` is above the
maximum extent.
