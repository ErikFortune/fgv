[Home](../README.md) > [DetailedFailure](./DetailedFailure.md) > aggregateError

## DetailedFailure.aggregateError() method

Propagates interior result, appending any error message to the
supplied errors array.

**Signature:**

```typescript
aggregateError(errors: IMessageAggregator, formatter?: ErrorFormatter<TD>): this;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>errors</td><td>IMessageAggregator</td><td>IMessageAggregator | Error aggregator in which
errors will be aggregated.</td></tr>
<tr><td>formatter</td><td>ErrorFormatter&lt;TD&gt;</td><td>An optional ErrorFormatter | error formatter to be used to format the error message.</td></tr>
</tbody></table>

**Returns:**

this
