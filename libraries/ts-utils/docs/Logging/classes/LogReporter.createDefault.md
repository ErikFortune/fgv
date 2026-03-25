[Home](../../README.md) > [Logging](../README.md) > [LogReporter](./LogReporter.md) > createDefault

## LogReporter.createDefault() method

Creates a default Logging.LogReporter | LogReporter with a Logging.NoOpLogger | NoOpLogger with the
supplied parameters, returning both the logger and reporter.

**Signature:**

```typescript
static createDefault(logger?: ILogger): Result<LogReporter<unknown, unknown>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>logger</td><td>ILogger</td><td>Optional logger to use; defaults to a new Logging.NoOpLogger | NoOpLogger if not provided.</td></tr>
</tbody></table>

**Returns:**

[Result](../../type-aliases/Result.md)&lt;[LogReporter](../../classes/LogReporter.md)&lt;unknown, unknown&gt;&gt;


