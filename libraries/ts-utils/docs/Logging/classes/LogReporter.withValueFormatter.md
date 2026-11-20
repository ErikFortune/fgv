[Home](../../README.md) > [Logging](../README.md) > [LogReporter](./LogReporter.md) > withValueFormatter

## LogReporter.withValueFormatter() method

Creates a new Logging.LogReporter | LogReporter with the same logger but a different value formatter.

**Signature:**

```typescript
withValueFormatter(valueFormatter: LogValueFormatter<TN, TD>): LogReporter<TN, TD>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>valueFormatter</td><td>LogValueFormatter&lt;TN, TD&gt;</td><td>The value formatter to use.</td></tr>
</tbody></table>

**Returns:**

[LogReporter](../../classes/LogReporter.md)&lt;TN, TD&gt;

A new Logging.LogReporter | LogReporter with the same logger but a different value formatter.
