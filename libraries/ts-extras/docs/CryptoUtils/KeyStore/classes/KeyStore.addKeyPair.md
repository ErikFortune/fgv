[Home](../../../README.md) > [CryptoUtils](../../README.md) > [KeyStore](../README.md) > [KeyStore](./KeyStore.md) > addKeyPair

## KeyStore.addKeyPair() method

Adds a new asymmetric keypair to the vault. Storage-first: the private key
is stored under a freshly-minted `id` before the public-key vault entry is
committed. If the storage call fails, no vault entry is written and the
operation returns Failure.

When `replace: true` displaces an existing entry (asymmetric or symmetric),
a fresh `id` is minted; the displaced entry's resources are released
best-effort. Failure of the storage delete is reported via `warning` on the
result but does not roll back the replacement.

Requires a CryptoUtils.KeyStore.IPrivateKeyStorage backend
supplied at construction.

**Signature:**

```typescript
addKeyPair(name: string, options: IAddKeyPairOptions): Promise<Result<IAddKeyPairResult>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>Unique name for the entry</td></tr>
<tr><td>options</td><td>IAddKeyPairOptions</td><td>Algorithm, optional description, replace flag</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IAddKeyPairResult](../../../interfaces/IAddKeyPairResult.md)&gt;&gt;

Success with the new entry, Failure if locked, no provider, or storage write failed
