[Home](../README.md) > [WriteGate](./WriteGate.md) > create

## WriteGate.create() method

Creates an open gate.

**Signature:**

```typescript
static create(options?: IWriteGateOptions): Result<WriteGate>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>IWriteGateOptions</td><td>The timer seam. A `schedule` that is not a function is refused.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[WriteGate](WriteGate.md)&gt;

The gate.
