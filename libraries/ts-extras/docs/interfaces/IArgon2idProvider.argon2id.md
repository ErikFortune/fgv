[Home](../README.md) > [IArgon2idProvider](./IArgon2idProvider.md) > argon2id

## IArgon2idProvider.argon2id() method

Derives key material from a password using Argon2id (RFC 9106 §3.1).

Returns the raw derived bytes as a `Uint8Array`. Both Node and browser
implementations produce bit-identical output for identical inputs.

**Signature:**

```typescript
argon2id(password: string | Uint8Array<ArrayBufferLike>, salt: Uint8Array, params: IArgon2idParams): Promise<Result<Uint8Array<ArrayBufferLike>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>password</td><td>string | Uint8Array&lt;ArrayBufferLike&gt;</td><td>Password or passphrase. Accepts string (UTF-8) or raw bytes.</td></tr>
<tr><td>salt</td><td>Uint8Array</td><td>Salt bytes. Must be random and unique per credential (\>= 16 bytes recommended).</td></tr>
<tr><td>params</td><td>IArgon2idParams</td><td>Argon2id parameters. Use `ARGON2ID_OWASP_MIN` as a starting point.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;Uint8Array&lt;ArrayBufferLike&gt;&gt;&gt;

Success with derived bytes, Failure with error context.
