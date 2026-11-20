[Home](../README.md) > [RangeOf](./RangeOf.md) > findTransition

## RangeOf.findTransition() method

Finds the transition value that would bring a supplied value `t` into
range.

**Signature:**

```typescript
findTransition(t: T): T | undefined;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>t</td><td>T</td><td>The value to be tested.</td></tr>
</tbody></table>

**Returns:**

T | undefined

The minimum extent of the range if `t` is below the range or
the maximum extent of the range if `t` is above the range.  Returns
`undefined` if `t` already falls within the range.
