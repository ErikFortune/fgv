[Home](../README.md) > [Success](./Success.md) > report

## Success.report() method

Reports the result to the supplied reporter

**Signature:**

```typescript
report(reporter?: IResultReporter<T, unknown>, options?: IResultReportOptions<unknown>): Success<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>reporter</td><td>IResultReporter&lt;T, unknown&gt;</td><td>The IResultReporter | reporter to which the result will be reported.</td></tr>
<tr><td>options</td><td>IResultReportOptions&lt;unknown&gt;</td><td>The IResultReportOptions | options for reporting the result.</td></tr>
</tbody></table>

**Returns:**

[Success](Success.md)&lt;T&gt;
