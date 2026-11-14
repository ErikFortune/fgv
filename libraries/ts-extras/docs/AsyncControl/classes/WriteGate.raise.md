[Home](../../README.md) > [AsyncControl](../README.md) > [WriteGate](./WriteGate.md) > raise

## WriteGate.raise() method

Raises the gate: every write guarded from now on is refused without running, and every write
waiting on a pause is woken and refused. Writes under way are not interrupted. Raising again
replaces the reason.

**Signature:**

```typescript
raise(reason: string): void;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>reason</td><td>string</td><td>Why, carried in every refusal.</td></tr>
</tbody></table>

**Returns:**

void
