[Home](../README.md) > [KeyStore](./KeyStore.md) > initialize

## KeyStore.initialize() method

Initializes a new key store with the master password.
Generates a random salt for key derivation.
Only valid for newly created (not opened) key stores.

**Signature:**

```typescript
initialize(password: string): Promise<Result<KeyStore>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>password</td><td>string</td><td>The master password</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[KeyStore](KeyStore.md)&gt;&gt;

Success with this instance when initialized, Failure if already initialized or opened
