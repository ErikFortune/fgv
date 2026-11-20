[Home](../../README.md) > [Logging](../README.md) > [LoggerBase](./LoggerBase.md) > _logStructured

## LoggerBase._logStructured() method

Inner hook called for logged messages alongside Logging.LoggerBase._log | _log,
exposing the structured `(level, formatted, message, parameters)` form before it is
collapsed to the formatted string. The default implementation is a no-op; subclasses
that need to retain structured records (e.g. Logging.RetainingLogger | RetainingLogger)
override this. Fired only in the `shouldLog` branch, so suppressed messages never reach it.

**Signature:**

```typescript
_logStructured(__level: MessageLogLevel, __formatted: string, __message?: unknown, __parameters?: readonly unknown[]): void;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>__level</td><td>MessageLogLevel</td><td>The MessageLogLevel | level of the message.</td></tr>
<tr><td>__formatted</td><td>string</td><td>The formatted message (same string passed to `_log`).</td></tr>
<tr><td>__message</td><td>unknown</td><td>The raw message argument before formatting.</td></tr>
<tr><td>__parameters</td><td>readonly unknown[]</td><td>The raw parameter arguments before formatting.</td></tr>
</tbody></table>

**Returns:**

void
