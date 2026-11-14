[Home](../../README.md) > [KeyStore](../README.md) > [KeyStore](./KeyStore.md) > removeSecret

## KeyStore.removeSecret() method

Removes a secret by name. Vault-first: the in-memory vault entry is dropped
before any storage cleanup runs. For asymmetric-keypair entries, best-effort
calls CryptoUtils.KeyStore.IPrivateKeyStorage.delete on the entry's
`id`; a failure is reported via `warning` on the result but does not roll
back the vault removal.

**Signature:**

```typescript
removeSecret(name: string): Promise<Result<IRemoveSecretResult>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>Name of the secret to remove</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IRemoveSecretResult](../../interfaces/IRemoveSecretResult.md)&gt;&gt;

Success with removed entry (and optional warning), Failure if not found or locked
