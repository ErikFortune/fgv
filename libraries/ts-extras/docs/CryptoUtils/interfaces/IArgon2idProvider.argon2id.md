[Home](../../README.md) > [CryptoUtils](../README.md) > [IArgon2idProvider](./IArgon2idProvider.md) > argon2id

## IArgon2idProvider.argon2id() method

Derives key material from a password using Argon2id (RFC 9106 §3.1).

Returns the raw derived bytes as a `Uint8Array`. For the same inputs that
both backends support, the Node and browser implementations produce
byte-identical output. The optional `associatedData` in
CryptoUtils.IArgon2idKeyingOptions is the one exception: it is
Node-only (the browser WASM backend has no associated-data input), so a call
that supplies non-empty `associatedData` is not portable to the browser
backend. Every input the browser backend *does* support (including the
optional `secret`) is byte-identical across the two.

**Signature:**

```typescript
argon2id(password: string | Uint8Array<ArrayBufferLike>, salt: Uint8Array, params: IArgon2idParams, options?: IArgon2idKeyingOptions): Promise<Result<Uint8Array<ArrayBufferLike>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>password</td><td>string | Uint8Array&lt;ArrayBufferLike&gt;</td><td>Password or passphrase. Accepts string (UTF-8) or raw bytes.</td></tr>
<tr><td>salt</td><td>Uint8Array</td><td>Salt bytes. Must be random and unique per credential (\>= 16 bytes recommended).</td></tr>
<tr><td>params</td><td>IArgon2idParams</td><td>Argon2id parameters. Use `ARGON2ID_OWASP_MIN` as a starting point.</td></tr>
<tr><td>options</td><td>IArgon2idKeyingOptions</td><td>Optional CryptoUtils.IArgon2idKeyingOptions | keyed-hashing inputs
(secret K and/or associated data X). Omitting them (the default) leaves the
output byte-identical to prior behavior.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;Uint8Array&lt;ArrayBufferLike&gt;&gt;&gt;

Success with derived bytes, Failure with error context.
