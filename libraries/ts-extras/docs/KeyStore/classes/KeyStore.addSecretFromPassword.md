[Home](../../README.md) > [KeyStore](../README.md) > [KeyStore](./KeyStore.md) > addSecretFromPassword

## KeyStore.addSecretFromPassword() method

Adds a secret derived from a password using PBKDF2.

Generates a random salt, derives a 32-byte AES-256 key from the password,
and stores it in the vault. Returns the key derivation parameters so they
can be stored alongside encrypted files, enabling decryption with just the
password (without unlocking the keystore).

**Signature:**

```typescript
addSecretFromPassword(name: string, password: string, options?: IAddSecretFromPasswordOptions): Promise<Result<IAddSecretFromPasswordResult>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>Unique name for the secret</td></tr>
<tr><td>password</td><td>string</td><td>Password to derive the key from</td></tr>
<tr><td>options</td><td>IAddSecretFromPasswordOptions</td><td>Optional description, iterations, replace flag</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IAddSecretFromPasswordResult](../../interfaces/IAddSecretFromPasswordResult.md)&gt;&gt;

Success with entry and keyDerivation params, Failure if locked or invalid
