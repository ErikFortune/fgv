[Home](../../README.md) > [AsyncControl](../README.md) > [WriteGate](./WriteGate.md) > guardDetailed

## WriteGate.guardDetailed() method

`guard` for a write that answers a detailed result. A refusal or a throw carries a
`WriteGateRefusal` as its detail; the write's own result passes through.

**Signature:**

```typescript
guardDetailed(write: () => Promise<DetailedResult<T, TD>>): AsyncDetailedResult<T, WriteGateRefusal | TD>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>write</td><td>() =&gt; Promise&lt;DetailedResult&lt;T, TD&gt;&gt;</td><td>The write. Called at most once, and only if the gate admits it.</td></tr>
</tbody></table>

**Returns:**

AsyncDetailedResult&lt;T, [WriteGateRefusal](../../type-aliases/WriteGateRefusal.md) | TD&gt;

The write's own result, or a failure detailed with why the gate answered instead.
