[Home](../README.md) > [Success](./Success.md) > aggregateError

## Success.aggregateError() method

Propagates interior result, appending any error message to the
supplied errors array.

**Signature:**

```typescript
aggregateError(__errors: IMessageAggregator, __formatter?: ErrorFormatter<unknown>): this;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>__errors</td><td>IMessageAggregator</td><td>IMessageAggregator | Error aggregator in which
errors will be aggregated.</td></tr>
<tr><td>__formatter</td><td>ErrorFormatter&lt;unknown&gt;</td><td>An optional ErrorFormatter | error formatter to be used to format the error message.</td></tr>
</tbody></table>

**Returns:**

this
