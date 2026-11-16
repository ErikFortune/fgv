[Home](../README.md) > [AsyncDetailedResult](./AsyncDetailedResult.md) > aggregateError

## AsyncDetailedResult.aggregateError() method

Propagates the wrapped result, appending any error message to the supplied errors aggregator.

**Signature:**

```typescript
aggregateError(errors: IMessageAggregator, formatter?: ErrorFormatter<TD>): AsyncDetailedResult<T, TD>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>errors</td><td>IMessageAggregator</td><td>IMessageAggregator | Error aggregator in which errors will be
aggregated.</td></tr>
<tr><td>formatter</td><td>ErrorFormatter&lt;TD&gt;</td><td>An optional ErrorFormatter | error formatter to be used to format
the error message.  Receives the detail alongside the message.</td></tr>
</tbody></table>

**Returns:**

[AsyncDetailedResult](AsyncDetailedResult.md)&lt;T, TD&gt;

A new AsyncDetailedResult wrapping the result after aggregation.
