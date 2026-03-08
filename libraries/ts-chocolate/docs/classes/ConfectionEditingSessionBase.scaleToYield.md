[Home](../README.md) > [ConfectionEditingSessionBase](./ConfectionEditingSessionBase.md) > scaleToYield

## ConfectionEditingSessionBase.scaleToYield() method

Scales to a new yield specification.
Implementation is type-specific:
- Molded bonbons: Frame-based with mold cavity calculation
- Bar/rolled truffles: Linear count-based scaling

**Signature:**

```typescript
scaleToYield(yieldSpec: BufferedConfectionYield): Result<BufferedConfectionYield>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>yieldSpec</td><td>BufferedConfectionYield</td><td>The new yield specification</td></tr>
</tbody></table>

**Returns:**

Result&lt;[BufferedConfectionYield](../type-aliases/BufferedConfectionYield.md)&gt;

Success with updated yield, or Failure
