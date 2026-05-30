[Home](../README.md) > [MessageAggregator](./MessageAggregator.md) > returnOrReport

## MessageAggregator.returnOrReport() method

If any error messages have been aggregated, returns
Failure | Failure<T> with the aggregated
messages concatenated using the optionally-supplied
separator, or newline.   If the supplied Result | Result<T>
contains an error message that has not already been aggregated,
it will be included in the aggregated messages.

If no error messages have been aggregated, returns
the supplied Result | Result<T>.

**Signature:**

```typescript
returnOrReport(result: Result<T>, separator?: string): Result<T>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>result</td><td>Result&lt;T&gt;</td><td>The Result | Result<T> to be returned
if no messages have been aggregated.</td></tr>
<tr><td>separator</td><td>string</td><td>Optional string separator used to construct
the error message.</td></tr>
</tbody></table>

**Returns:**

[Result](../type-aliases/Result.md)&lt;T&gt;

Failure | Failure<T> with an aggregated message
if any error messages were collected, the supplied
Result | Result<T> otherwise.
