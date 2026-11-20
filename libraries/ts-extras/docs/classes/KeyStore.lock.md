[Home](../README.md) > [KeyStore](./KeyStore.md) > lock

## KeyStore.lock() method

Locks the key store, clearing all secrets from memory.

**Signature:**

```typescript
lock(force?: boolean): Result<KeyStore>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>force</td><td>boolean</td><td>If true, discards unsaved changes</td></tr>
</tbody></table>

**Returns:**

Result&lt;[KeyStore](KeyStore.md)&gt;

Success when locked, Failure if unsaved changes and !force
