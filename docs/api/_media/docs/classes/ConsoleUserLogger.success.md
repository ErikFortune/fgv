[Home](../README.md) > [ConsoleUserLogger](./ConsoleUserLogger.md) > success

## ConsoleUserLogger.success() method

Logs a success message for user feedback.

**Signature:**

```typescript
success(message?: unknown, parameters: unknown[]): Success<string | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>message</td><td>unknown</td><td>The message to log.</td></tr>
<tr><td>parameters</td><td>unknown[]</td><td>The parameters to log.</td></tr>
</tbody></table>

**Returns:**

Success&lt;string | undefined&gt;

`Success` with the logged message if the level is enabled, or
`Success` with `undefined` if the message is suppressed.
