[Home](../../README.md) > [Logging](../README.md) > [LogReporter](./LogReporter.md) > warnWithDetail

## LogReporter.warnWithDetail() method

Logs a short warning summary at `warning` level, then emits `detail` at `detail` level.

**Signature:**

```typescript
warnWithDetail(message: string, detail: unknown): Success<string | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>message</td><td>string</td><td>Short human-readable summary.</td></tr>
<tr><td>detail</td><td>unknown</td><td>Full detail logged at `detail` level.</td></tr>
</tbody></table>

**Returns:**

[Success](../../classes/Success.md)&lt;string | undefined&gt;
