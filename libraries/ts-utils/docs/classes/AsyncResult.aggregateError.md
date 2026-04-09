[Home](../README.md) > [AsyncResult](./AsyncResult.md) > aggregateError

## AsyncResult.aggregateError() method

Propagates the wrapped result, appending any error message to the
supplied errors aggregator.

**Signature:**

```typescript
aggregateError(errors: IMessageAggregator, formatter?: ErrorFormatter<unknown>): AsyncResult<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>errors</td><td>IMessageAggregator</td><td>IMessageAggregator | Error aggregator in which
errors will be aggregated.</td></tr>
<tr><td>formatter</td><td>ErrorFormatter&lt;unknown&gt;</td><td>An optional ErrorFormatter | error formatter
to be used to format the error message.</td></tr>
</tbody></table>

**Returns:**

[AsyncResult](AsyncResult.md)&lt;T&gt;

A new AsyncResult wrapping the result after aggregation.
