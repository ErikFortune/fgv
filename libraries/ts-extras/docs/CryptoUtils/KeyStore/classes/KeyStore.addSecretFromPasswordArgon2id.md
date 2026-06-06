[Home](../../../README.md) > [CryptoUtils](../../README.md) > [KeyStore](../README.md) > [KeyStore](./KeyStore.md) > addSecretFromPasswordArgon2id

## KeyStore.addSecretFromPasswordArgon2id() method

Adds a secret derived from a password using Argon2id (RFC 9106).

The Argon2id provider must be supplied explicitly; the KeyStore does not
hold one by default (consumers opt in by depending on the argon2 package).

Returns the key derivation parameters so callers can store them alongside
encrypted artifacts, enabling future re-derivation and verification.

**Signature:**

```typescript
addSecretFromPasswordArgon2id(name: string, password: string, argon2idProvider: IArgon2idProvider, options?: IAddSecretFromPasswordArgon2idOptions): Promise<Result<IAddSecretFromPasswordResult>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>Unique name for the secret</td></tr>
<tr><td>password</td><td>string</td><td>Password or passphrase</td></tr>
<tr><td>argon2idProvider</td><td>IArgon2idProvider</td><td>Argon2id provider (Node or Browser implementation)</td></tr>
<tr><td>options</td><td>IAddSecretFromPasswordArgon2idOptions</td><td>Optional: Argon2id params (defaults to ARGON2ID_OWASP_MIN), description, replace flag</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IAddSecretFromPasswordResult](../../../interfaces/IAddSecretFromPasswordResult.md)&gt;&gt;

Success with entry and keyDerivation params, Failure if locked or invalid
