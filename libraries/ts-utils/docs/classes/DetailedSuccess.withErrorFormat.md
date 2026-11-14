[Home](../README.md) > [DetailedSuccess](./DetailedSuccess.md) > withErrorFormat

## DetailedSuccess.withErrorFormat() method

Calls a supplied ErrorFormatter | error formatter if
the operation failed.

**Signature:**

```typescript
withErrorFormat(cb: ErrorFormatter): DetailedResult<T, TD>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cb</td><td>ErrorFormatter</td><td>The ErrorFormatter | error formatter to
be called in the event of failure.</td></tr>
</tbody></table>

**Returns:**

[DetailedResult](../type-aliases/DetailedResult.md)&lt;T, TD&gt;

If this operation failed, returns the returns Failure | Failure
with the message returned by the formatter.  If this result
was successful, propagates the result value from the successful event.
