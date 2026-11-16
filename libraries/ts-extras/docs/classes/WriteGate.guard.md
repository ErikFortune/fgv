[Home](../README.md) > [WriteGate](./WriteGate.md) > guard

## WriteGate.guard() method

Runs `write` through the gate: refused while it is raised, held while it is paused, and
counted in `inFlight` while it runs.

**Signature:**

```typescript
guard(write: AsyncDeferredResult<T>): AsyncResult<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>write</td><td>AsyncDeferredResult&lt;T&gt;</td><td>The write. Called at most once, and only if the gate admits it.</td></tr>
</tbody></table>

**Returns:**

AsyncResult&lt;T&gt;

The write's own result; a refusal or a throw is a failure.
