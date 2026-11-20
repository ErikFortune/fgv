[Home](../../../README.md) > [CryptoUtils](../../README.md) > [KeyStore](../README.md) > [KeyStore](./KeyStore.md) > verifySecretFromPasswordArgon2id

## KeyStore.verifySecretFromPasswordArgon2id() method

Verifies a candidate password against an Argon2id-derived entry using the
supplied key derivation parameters. Constant-time comparison.

**Signature:**

```typescript
verifySecretFromPasswordArgon2id(name: string, password: string, argon2idProvider: IArgon2idProvider, keyDerivation: IArgon2idKeyDerivationParams): Promise<Result<boolean>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>Name of the secret to verify against</td></tr>
<tr><td>password</td><td>string</td><td>Candidate password to test</td></tr>
<tr><td>argon2idProvider</td><td>IArgon2idProvider</td><td>Argon2id provider (must produce bit-identical output for identical inputs)</td></tr>
<tr><td>keyDerivation</td><td>IArgon2idKeyDerivationParams</td><td>The Argon2id key derivation parameters returned by `addSecretFromPasswordArgon2id`</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;boolean&gt;&gt;

Success(true) if candidate matches stored key, Success(false) if not,
Failure if locked, secret missing, wrong type, or derivation fails
