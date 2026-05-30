[Home](../README.md) > [NodeCryptoProvider](./NodeCryptoProvider.md) > encrypt

## NodeCryptoProvider.encrypt() method

Encrypts plaintext using AES-256-GCM.

**Signature:**

```typescript
encrypt(plaintext: string, key: Uint8Array): Promise<Result<IEncryptionResult>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>plaintext</td><td>string</td><td>UTF-8 string to encrypt</td></tr>
<tr><td>key</td><td>Uint8Array</td><td>32-byte encryption key</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IEncryptionResult](../interfaces/IEncryptionResult.md)&gt;&gt;

`Success` with encryption result, or `Failure` with an error.
