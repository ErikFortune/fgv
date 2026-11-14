[Home](../../README.md) > [KeyStore](../README.md) > [KeyStore](./KeyStore.md) > verifySecretFromPassword

## KeyStore.verifySecretFromPassword() method

Verifies that a candidate password derives the same key material currently
stored under `name`, using the supplied
CryptoUtils.IKeyDerivationParams | key derivation parameters.

The keystore does not persist per-slot key derivation parameters with the
entry — callers receive them from `addSecretFromPassword` and store them
alongside the encrypted artifact (or wherever else makes sense). Pass
those same parameters here for verification.

Re-derives a key from `password` + `keyDerivation`, then compares it to
the stored key material in constant time. Restricted to entries of type
`'encryption-key'` — the type produced by `addSecretFromPassword`. Other
symmetric types (`'api-key'`) and asymmetric entries are rejected so
the boolean result reflects "this slot accepts this password" rather
than an incidental byte-equality match against unrelated material.

Note: the keystore does not currently flag whether an `'encryption-key'`
entry was actually password-derived (vs. random via `addSecret` or raw
via `importSecret`). A `true` result therefore means "the candidate
password produces the same 32 bytes currently stored", which is what
the equivalent consumer-side helper (`verifyGatePassword`) already
implies for entries it manages.

**Signature:**

```typescript
verifySecretFromPassword(name: string, password: string, keyDerivation: IKeyDerivationParams): Promise<Result<boolean>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>Name of the secret to verify against</td></tr>
<tr><td>password</td><td>string</td><td>Candidate password to test</td></tr>
<tr><td>keyDerivation</td><td>IKeyDerivationParams</td><td>The key derivation parameters returned by
`addSecretFromPassword` when the secret was created. Only
`kdf: 'pbkdf2'` is supported.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;boolean&gt;&gt;

Success(true) when the candidate matches the stored key,
Success(false) when it does not, Failure if locked, secret missing,
wrong type, unsupported `kdf`, or key derivation fails
