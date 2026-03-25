[Home](../../README.md) > [Logging](../README.md) > [LoggerBase](./LoggerBase.md) > errorWithDetail

## LoggerBase.errorWithDetail() method

Logs a short error summary at `error` level, then emits `detail` at `detail` level.

**Signature:**

```typescript
errorWithDetail(message: string, detail: unknown): Success<string | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>message</td><td>string</td><td>Short human-readable summary.</td></tr>
<tr><td>detail</td><td>unknown</td><td>Full detail (e.g. raw converter error) logged at `detail` level.</td></tr>
</tbody></table>

**Returns:**

[Success](../../classes/Success.md)&lt;string | undefined&gt;
