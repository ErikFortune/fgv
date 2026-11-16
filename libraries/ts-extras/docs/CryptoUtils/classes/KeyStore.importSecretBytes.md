[Home](../../README.md) > [CryptoUtils](../README.md) > [KeyStore](./KeyStore.md) > importSecretBytes

## KeyStore.importSecretBytes() method

Imports arbitrary raw bytes into the vault with type `'opaque'`.

Unlike KeyStore.importSecret (which enforces a 32-byte AES-256 key)
and KeyStore.importApiKey (which UTF-8 encodes a string), this
accepts a byte buffer of any length and stores it verbatim — including
embedded NUL bytes. Use it for byte blobs that are neither a fixed-size key
nor a UTF-8 string (e.g. a serialized credential bundle), so they are not
mistyped as `'api-key'`.

**Signature:**

```typescript
importSecretBytes(name: string, bytes: Uint8Array, options?: IImportSecretBytesOptions): Promise<Result<IAddSecretResult>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>Unique name for the secret</td></tr>
<tr><td>bytes</td><td>Uint8Array</td><td>The raw bytes to store</td></tr>
<tr><td>options</td><td>IImportSecretBytesOptions</td><td>Optional description, initial metadata, whether to replace existing</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IAddSecretResult](../../interfaces/IAddSecretResult.md)&gt;&gt;

Success with entry, Failure if locked, empty, or exists and !replace
