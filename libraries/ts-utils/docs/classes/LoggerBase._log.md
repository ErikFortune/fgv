[Home](../README.md) > [LoggerBase](./LoggerBase.md) > _log

## LoggerBase._log() method

Inner method called for logged messages. Should be implemented by derived classes.

**Signature:**

```typescript
_log(message: string, level: MessageLogLevel): Success<string | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>message</td><td>string</td><td>The message to log.</td></tr>
<tr><td>level</td><td>MessageLogLevel</td><td>The MessageLogLevel | level of the message.</td></tr>
</tbody></table>

**Returns:**

[Success](Success.md)&lt;string | undefined&gt;

`Success` with the logged message, or `Success` with `undefined` if the message is suppressed.
