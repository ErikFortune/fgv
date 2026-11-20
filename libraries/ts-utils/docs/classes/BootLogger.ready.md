[Home](../README.md) > [BootLogger](./BootLogger.md) > ready

## BootLogger.ready() method

Connects this boot logger to a real logger.
All buffered entries are replayed to the new logger in order,
and all subsequent calls are forwarded directly.

**Signature:**

```typescript
ready(logger: ILogger): void;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>logger</td><td>ILogger</td><td>The real logger to forward to.</td></tr>
</tbody></table>

**Returns:**

void
