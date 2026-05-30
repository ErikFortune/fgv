[Home](../README.md) > [AsyncResult](./AsyncResult.md) > withErrorFormat

## AsyncResult.withErrorFormat() method

Calls a supplied ErrorFormatter | error formatter if
the wrapped result is a failure.

**Signature:**

```typescript
withErrorFormat(cb: ErrorFormatter): AsyncResult<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cb</td><td>ErrorFormatter</td><td>The ErrorFormatter | error formatter to
be called in the event of failure.</td></tr>
</tbody></table>

**Returns:**

[AsyncResult](AsyncResult.md)&lt;T&gt;

A new AsyncResult with the formatted error message,
or the original success result.
