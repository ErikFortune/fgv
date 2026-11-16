[Home](../README.md) > [AsyncDetailedResult](./AsyncDetailedResult.md) > withErrorFormat

## AsyncDetailedResult.withErrorFormat() method

Calls a supplied ErrorFormatter | error formatter if the wrapped result is a failure.

**Signature:**

```typescript
withErrorFormat(cb: ErrorFormatter<TD>): AsyncDetailedResult<T, TD>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cb</td><td>ErrorFormatter&lt;TD&gt;</td><td>The ErrorFormatter | error formatter to be called in the event of failure.</td></tr>
</tbody></table>

**Returns:**

[AsyncDetailedResult](AsyncDetailedResult.md)&lt;T, TD&gt;

A new AsyncDetailedResult with the formatted error message, or the original
success result.
